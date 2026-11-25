import * as React from "react";
function PageStrip({ children }) {
  const ref = React.useRef(null);
  const items = React.Children.toArray(children);
  const current = Math.max(
    0,
    items.findIndex((c) => c.props?.["aria-current"] === "page"),
  );
  React.useLayoutEffect(() => {
    const list = ref.current,
      active = list?.querySelector("[aria-current=page]");
    if (list && active)
      list.scrollTo({
        left: Math.max(
          0,
          active.offsetLeft - (list.clientWidth - active.offsetWidth) / 2,
        ),
        behavior: "instant",
      });
  }, [current, items.length]);
  React.useEffect(() => {
    const list = ref.current;
    const wheel = (e) => {
      if (list.scrollWidth > list.clientWidth) {
        e.preventDefault();
        e.stopPropagation();
        list.scrollLeft += e.deltaX || e.deltaY;
      }
    };
    list?.addEventListener("wheel", wheel, { passive: false });
    return () => list?.removeEventListener("wheel", wheel);
  }, []);
  return (
    <React.Fragment>
      {
        <div
          ref={ref}
          className={"scene-chips"}
          tabIndex={0}
          aria-label={"\u53EF\u6EDA\u52A8\u9875\u7801"}
        >
          {children}
        </div>
      }
      {
        <label className={"stage-page-jump"}>
          {
            <span className={"stage-sr-only"}>
              {"\u8DF3\u8F6C\u9875\u9762"}
            </span>
          }
          {
            <select
              aria-label={"\u8DF3\u8F6C\u9875\u9762"}
              value={current}
              onChange={(e) =>
                items[Number(e.target.value)]?.props?.onClick?.()
              }
            >
              {items.map((c, i) => (
                <option key={i} value={i}>
                  {String(i + 1).padStart(2, "0") +
                    " / " +
                    items.length +
                    (c.props.title ? " " + c.props.title : "")}
                </option>
              ))}
            </select>
          }
        </label>
      }
    </React.Fragment>
  );
}

export default PageStrip;
