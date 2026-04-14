import { UNNAMED_GROUP_PREFIX } from "./_segment-wildcards.ts";
import type { MatchedRoute, MethodData, Node, RouterContext } from "./types.ts";

export interface RouterCompilerOptions<T = any> {
  matchAll?: boolean;
  normalize?: boolean;
  serialize?: (data: T) => string;
}

/**
 * Compiles the router instance into a faster route-matching function.
 *
 * **IMPORTANT:** `compileRouter` requires eval support with `new Function()` in the runtime for JIT compilation.
 *
 * @example
 * import { createRouter, addRoute } from "rou3";
 * import { compileRouter } from "rou3/compiler";
 * const router = createRouter();
 * // [add some routes]
 * const findRoute = compileRouter(router);
 * const matchAll = compileRouter(router, { matchAll: true });
 * findRoute("GET", "/path/foo/bar");
 *
 * @param router - The router context to compile.
 */
export function compileRouter<T, O extends RouterCompilerOptions<T> = RouterCompilerOptions<T>>(
  router: RouterContext<T>,
  opts?: O,
): (
  method: string,
  path: string,
) => O["matchAll"] extends true ? MatchedRoute<T>[] : MatchedRoute<T> | undefined {
  const ctx: CompilerContext = { opts: opts || {}, router, data: [] };
  const compiled = compileRouteMatch(ctx);
  return new Function(...ctx.data!.map((_, i) => `$${i}`), `return(m,p)=>{${compiled}}`)(
    ...ctx.data!,
  );
}

/**
 * Compile the router instance into a compact runnable code.
 *
 * **IMPORTANT:** Route data must be serializable to JSON (i.e., no functions or classes) or implement the `toJSON()` method to render custom code or you can pass custom `serialize` function in options.
 *
 * @example
 * import { createRouter, addRoute } from "rou3";
 * import { compileRouterToString } from "rou3/compiler";
 * const router = createRouter();
 * // [add some routes with serializable data]
 * const compilerCode = compileRouterToString(router, "findRoute");
 * // "const findRoute=(m, p) => {}"
 */
export function compileRouterToString(
  router: RouterContext,
  functionName?: string,
  opts?: RouterCompilerOptions,
): string {
  const ctx: CompilerContext = {
    opts: opts || {},
    router,
    data: [],
    compileToString: true,
  };
  let compiled = `(m,p)=>{${compileRouteMatch(ctx)}}`;
  if (ctx.data.length > 0) {
    const dataCode = `const ${ctx.data.map((v, i) => `$${i}=${v}`).join(",")};`;
    compiled = `/* @__PURE__ */ (() => { ${dataCode}; return ${compiled}})()`;
  }
  return functionName ? `const ${functionName}=${compiled};` : compiled;
}

// ------- internal functions -------

interface CompilerContext {
  opts: RouterCompilerOptions;
  router: RouterContext<any>;
  compileToString?: boolean;
  data: string[];
}

// Trie position: either a literal character index (number) or a runtime JS expression (string).
type TriePos = number | string;

// Add n to a trie position. Folds consecutive numeric suffixes for clean output.
function posAdd(pos: TriePos, n: number): TriePos {
  if (n === 0) return pos;
  if (typeof pos === "number") return pos + n;
  // Simplify "expr+K" + n → "expr+(K+n)"
  const m = /^(.+)\+(\d+)$/.exec(pos);
  if (m) return `${m[1]}+${Number(m[2]) + n}`;
  return `${pos}+${n}`;
}

function posStr(pos: TriePos): string {
  return String(pos);
}

// Build a JS expression that checks '/' at pos, then each character of key,
// then a word-boundary (end of string OR next char is '/').
function compileStaticSegmentCheck(pos: TriePos, key: string): string {
  const endPos = posAdd(pos, 1 + key.length);
  const parts: string[] = [`p.charCodeAt(${posStr(pos)})===${47 /* '/' */}`];
  for (let i = 0; i < key.length; i++) {
    parts.push(`p.charCodeAt(${posStr(posAdd(pos, i + 1))})===${key.charCodeAt(i)}`);
  }
  // Boundary: path ends exactly here OR the next char is another '/'
  parts.push(`(len===${posStr(endPos)}||p.charCodeAt(${posStr(endPos)})===${47})`);
  return parts.join("&&");
}

// Recursively compile a trie node into a JS code string.
// pos  – character position in `p` after the prefix matched by this node's ancestors.
// params – JS expressions for each already-captured dynamic segment value.
function compileTrieNode(
  ctx: CompilerContext,
  node: Node<any>,
  params: string[],
  pos: TriePos,
): string {
  let code = "";
  let hasIf = false;

  // 1. Method match – only for nodes reached through at least one dynamic segment.
  if (node.methods && params.length > 0) {
    const match = compileMethodMatch(ctx, node.methods, params, -1);
    if (match) {
      code += `if(len===${posStr(pos)}){${match}}`;
      hasIf = true;
    }
  }

  // 2. Static children – build an if / else-if chain keyed on char codes (trie branching).
  if (node.static) {
    let staticCode = "";
    for (const key in node.static) {
      const childPos = posAdd(pos, 1 + key.length);
      const childCode = compileTrieNode(ctx, node.static[key], params, childPos);
      if (childCode) {
        const check = compileStaticSegmentCheck(pos, key);
        staticCode += `${hasIf ? "else " : ""}if(${check}){${childCode}}`;
        hasIf = true;
      }
    }
    if (staticCode) code += staticCode;
  }

  // 3. Param child – extract the next path segment with indexOf / slice.
  if (node.param) {
    const paramNode = node.param;
    const paramVar = `_p${params.length}`;
    const endVar = `_ep${params.length}`;
    const segStart = posStr(posAdd(pos, 1));
    const newParams = [...params, paramVar];

    // Optional-absent case: path ends right at `pos`, so no segment was provided.
    // Only emit a match for routes whose last param is marked optional.
    if (paramNode.methods) {
      const absentMatch = compileMethodMatch(
        ctx,
        paramNode.methods,
        [...params, "undefined"],
        -1,
        true /* absentParam */,
      );
      if (absentMatch) {
        code += `if(len===${posStr(pos)}){${absentMatch}}`;
      }
    }

    // Param-present case: there is at least one character beyond the '/' at pos.
    const innerCode = compileTrieNode(ctx, paramNode, newParams, endVar);
    if (innerCode) {
      code +=
        `if(len>${posStr(posAdd(pos, 1))}){` +
        `let ${endVar}=p.indexOf("/",${segStart});` +
        `if(${endVar}===-1)${endVar}=len;` +
        `const ${paramVar}=p.slice(${segStart},${endVar});` +
        `${innerCode}}`;
    }
  }

  // 4. Wildcard child – captures everything from pos+1 to end of string.
  if (node.wildcard) {
    const { wildcard } = node;
    if (wildcard.static || wildcard.param || wildcard.wildcard) {
      throw new Error("Compiler mode does not support patterns after wildcard");
    }
    if (wildcard.methods) {
      const boundary = posAdd(pos, 1);
      const wildcardParam = `p.slice(${posStr(boundary)})`;
      // Pass boundary so compileFinalMatch can guard required (named) wildcards.
      code += compileMethodMatch(ctx, wildcard.methods, params.concat(wildcardParam), -1, false, boundary);
    }
  }

  return code;
}

function compileRouteMatch(ctx: CompilerContext): string {
  let code = "";

  {
    let hasIf = false;
    for (const key in ctx.router.static) {
      const node = ctx.router.static[key];
      if (node?.methods) {
        code += `${hasIf ? "else " : ""}if(p===${JSON.stringify(key.replace(/\/$/, "") || "/")}){${compileMethodMatch(ctx, node.methods, [], -1)}}`;
        hasIf = true;
      }
    }
  }

  const match = compileTrieNode(ctx, ctx.router.root, [], 0);
  if (match) {
    code += `const len=p.length;${match}`;
  }

  if (!code) {
    return ctx.opts?.matchAll ? `return [];` : "";
  }

  const normalizeHelper = code.includes("_normalizeGroups(")
    ? `const _prefix=${JSON.stringify(UNNAMED_GROUP_PREFIX)},_prefixLen=${UNNAMED_GROUP_PREFIX.length};const _normalizeGroups=(g)=>{if(!g)return g;for(const k in g){if(k.startsWith(_prefix)){g[k.slice(_prefixLen)]=g[k];delete g[k]}}return g;};`
    : "";

  const normalizePathHelper = ctx.opts?.normalize
    ? `if(p.includes("/.")){let _r=[];for(let _v of p.split("/")){if(_v===".")continue;_v===".."&&_r.length>1?_r.pop():_r.push(_v)}p=_r.join("/")||"/"}`
    : "";

  return `${ctx.opts?.matchAll ? `let r=[];` : ""}${normalizeHelper}${normalizePathHelper}if(p.charCodeAt(p.length-1)===47)p=p.slice(0,-1)||"/";${code}${ctx.opts?.matchAll ? "return r;" : ""}`;
}

// absentParam: when true, only include matchers whose last paramsMap entry is optional.
// wildcardBoundary: when set, required wildcards get a len>boundary guard.
function compileMethodMatch(
  ctx: CompilerContext,
  methods: Record<string, MethodData<any>[] | undefined>,
  params: string[],
  currentIdx: number,
  absentParam?: boolean,
  wildcardBoundary?: TriePos,
): string {
  let code = "";
  for (const key in methods) {
    const matchers = methods[key];
    if (!matchers || matchers.length === 0) continue;

    const filtered = absentParam
      ? matchers.filter((m) => m.paramsMap?.[m.paramsMap.length - 1]?.[2])
      : matchers;
    if (filtered.length === 0) continue;

    if (key !== "") code += `if(m==="${key}")${filtered.length > 1 ? "{" : ""}`;
    const _matchers = filtered
      .map((m) => compileFinalMatch(ctx, m, currentIdx, params, wildcardBoundary))
      .sort((a, b) => b.weight - a.weight);
    for (const matcher of _matchers) {
      code += matcher.code;
    }
    if (key !== "") code += filtered.length > 1 ? "}" : "";
  }
  return code;
}

function compileFinalMatch(
  ctx: CompilerContext,
  data: MethodData<any>,
  _currentIdx: number,
  params: string[],
  wildcardBoundary?: TriePos,
): { code: string; weight: number } {
  let ret = `{data:${serializeData(ctx, data.data)}`;

  const conditions: string[] = [];

  // Add param properties
  const { paramsMap, paramsRegexp } = data;
  if (paramsMap && paramsMap.length > 0) {
    // For required (named) wildcards: ensure the wildcard segment is non-empty.
    if (wildcardBoundary !== undefined && !paramsMap[paramsMap.length - 1][2]) {
      conditions.push(`len>${posStr(wildcardBoundary)}`);
    }
    // Check regexp constraints using paramsMap-indexed param expressions.
    for (let j = 0; j < paramsMap.length; j++) {
      const regexp = paramsRegexp[paramsMap[j][0]];
      if (!regexp) continue;
      conditions.push(`${regexp.toString()}.test(${params[j]})`);
    }

    // Create the param object based on captured param expressions.
    ret += ",params:{";
    for (let i = 0; i < paramsMap.length; i++) {
      const map = paramsMap[i];
      ret +=
        typeof map[1] === "string"
          ? `${JSON.stringify(map[1])}:${params[i]},`
          : `..._normalizeGroups((${map[1].toString()}.exec(${params[i]}))?.groups),`;
    }
    ret += "}";
  }

  const code =
    (conditions.length > 0 ? `if(${conditions.join("&&")})` : "") +
    (ctx.opts?.matchAll ? `r.unshift(${ret}});` : `return ${ret}};`);

  return { code, weight: conditions.length };
}

function serializeData(ctx: CompilerContext, value: any): string {
  if (ctx.compileToString) {
    if (ctx.opts?.serialize) {
      value = ctx.opts.serialize(value);
    } else if (typeof value?.toJSON === "function") {
      value = value.toJSON();
    } else {
      value = JSON.stringify(value);
    }
  }
  let index = ctx.data.indexOf(value);
  if (index === -1) {
    ctx.data.push(value);
    index = ctx.data.length - 1;
  }
  return `$${index}`;
}
