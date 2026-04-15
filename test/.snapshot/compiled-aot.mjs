const findRoute = /* @__PURE__ */ (() => {
  const $0 = { path: "/test" },
    $1 = { path: "/test/foo" },
    $2 = { path: "/test/foo/bar/qux" },
    $3 = { path: "/test/foo/baz" },
    $4 = { path: "/test/fooo" },
    $5 = { path: "/another/path" },
    $6 = { path: "/static\\:path/\\*/\\*\\*" },
    $7 = { path: "/test/foo/*" },
    $8 = { path: "/test/foo/**" },
    $9 = { path: "/test/:id" },
    $10 = { path: "/test/:idY/y" },
    $11 = { path: "/test/:idYZ/y/z" },
    $12 = { path: "/wildcard/**" },
    $13 = { path: "/**" };
  return (m, p) => {
    if (p[p.length - 1] === "/") p = p.slice(0, -1) || "/";
    if (p === "/test") {
      if (m === "GET") return { data: $0 };
    } else if (p === "/test/foo") {
      if (m === "GET") return { data: $1 };
    } else if (p === "/test/foo/bar/qux") {
      if (m === "GET") return { data: $2 };
    } else if (p === "/test/foo/baz") {
      if (m === "GET") return { data: $3 };
    } else if (p === "/test/fooo") {
      if (m === "GET") return { data: $4 };
    } else if (p === "/another/path") {
      if (m === "GET") return { data: $5 };
    } else if (p === "/static:path/*/**") {
      if (m === "GET") return { data: $6 };
    }
    const len = p.length;
    if (p.startsWith("/test") && (len === 5 || p[5] === "/")) {
      if (p.startsWith("/foo", 5) && (len === 9 || p[9] === "/")) {
        if (len === 9) {
          if (m === "GET") return { data: $7, params: { 0: undefined } };
        }
        if (len > 10) {
          const _ep0 = p.indexOf("/", 10);
          if (_ep0 === -1) {
            const _p0 = p.slice(10);
            if (m === "GET") return { data: $7, params: { 0: _p0 } };
          }
        }
        if (m === "GET") return { data: $8, params: { _: p.slice(10) } };
      }
      if (len > 6) {
        let _ep0 = p.indexOf("/", 6);
        if (_ep0 === -1) _ep0 = len;
        const _p0 = p.slice(6, _ep0);
        if (len === _ep0) {
          if (m === "GET") return { data: $9, params: { id: _p0 } };
        } else if (p.startsWith("/y", _ep0) && (len === _ep0 + 2 || p[_ep0 + 2] === "/")) {
          if (len === _ep0 + 2) {
            if (m === "GET") return { data: $10, params: { idY: _p0 } };
          } else if (p.startsWith("/z", _ep0 + 2) && (len === _ep0 + 4 || p[_ep0 + 4] === "/")) {
            if (len === _ep0 + 4) {
              if (m === "GET") return { data: $11, params: { idYZ: _p0 } };
            }
          }
        }
      }
    } else if (p.startsWith("/wildcard") && (len === 9 || p[9] === "/")) {
      if (m === "GET") return { data: $12, params: { _: p.slice(10) } };
    }
    if (m === "GET") return { data: $13, params: { _: p.slice(1) } };
  };
})();
