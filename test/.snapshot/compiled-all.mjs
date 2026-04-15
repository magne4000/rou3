(m, p) => {
  let r = [];
  if (p[p.length - 1] === "/") p = p.slice(0, -1) || "/";
  if (p === "/foo") {
    if (m === "GET") r.unshift({ data: $0 });
  } else if (p === "/foo/bar") {
    if (m === "GET") r.unshift({ data: $1 });
  } else if (p === "/foo/bar/baz") {
    if (m === "GET") r.unshift({ data: $2 });
  }
  const len = p.length;
  if (p.startsWith("/foo") && (len === 4 || p[4] === "/")) {
    if (len > 5) {
      let _ep0 = p.indexOf("/", 5);
      if (_ep0 === -1) _ep0 = len;
      const _p0 = p.slice(5, _ep0);
      if (p.startsWith("/baz", _ep0) && (len === _ep0 + 4 || p[_ep0 + 4] === "/")) {
        if (len === _ep0 + 4) {
          if (m === "GET") r.unshift({ data: $3, params: { 0: _p0 } });
        }
      }
    }
    if (m === "GET") r.unshift({ data: $4, params: { _: p.slice(5) } });
  }
  if (m === "GET") r.unshift({ data: $5, params: { _: p.slice(1) } });
  return r;
};
