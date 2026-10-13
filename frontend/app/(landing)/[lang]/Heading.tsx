import { Fragment } from "react";

import type { Heading as HeadingText } from "./content";

/** 제목 문자열의 `\n`을 줄바꿈으로 그린다(App Store 스크린샷과 같은 줄나눔). */
export default function Heading({ text }: { text: HeadingText }) {
  const lines = text.split("\n");
  return lines.map((line, i) => (
    <Fragment key={i}>
      {line}
      {i < lines.length - 1 && <br />}
    </Fragment>
  ));
}
