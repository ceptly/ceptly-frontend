/** Viewport coordinates for positioning a popover at a textarea caret. */
export interface TextareaCaretCoordinates {
  top: number;
  left: number;
  height: number;
}

const MIRROR_STYLE_PROPERTIES = [
  "boxSizing",
  "width",
  "overflowX",
  "overflowY",
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "fontStyle",
  "fontVariant",
  "fontWeight",
  "fontStretch",
  "fontSize",
  "lineHeight",
  "fontFamily",
  "textAlign",
  "textTransform",
  "textIndent",
  "letterSpacing",
  "wordSpacing",
  "tabSize",
] as const;

export function getTextareaCaretCoordinates(
  element: HTMLTextAreaElement,
  position: number,
): TextareaCaretCoordinates {
  const style = window.getComputedStyle(element);
  const mirror = document.createElement("div");

  mirror.style.position = "absolute";
  mirror.style.visibility = "hidden";
  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.wordWrap = "break-word";
  mirror.style.top = "0";
  mirror.style.left = "-9999px";

  for (const property of MIRROR_STYLE_PROPERTIES) {
    mirror.style[property] = style[property];
  }

  mirror.style.width = `${element.clientWidth}px`;

  const textBefore = element.value.slice(0, position);
  const textAfter = element.value.slice(position);
  const marker = document.createElement("span");
  marker.textContent = textAfter.length > 0 ? textAfter[0]! : "\u200b";

  mirror.textContent = textBefore;
  mirror.appendChild(marker);
  document.body.appendChild(mirror);

  const elementRect = element.getBoundingClientRect();
  const lineHeight =
    Number.parseFloat(style.lineHeight) ||
    Number.parseFloat(style.fontSize) * 1.2 ||
    20;

  const coordinates: TextareaCaretCoordinates = {
    top: elementRect.top + marker.offsetTop - element.scrollTop,
    left: elementRect.left + marker.offsetLeft - element.scrollLeft,
    height: lineHeight,
  };

  document.body.removeChild(mirror);
  return coordinates;
}
