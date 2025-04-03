// client/src/components/PortableTextComponent.js
import { PortableText } from "@portabletext/react";
import styled from "styled-components";

const StyledParagraph = styled.p`
  color: #bbb;
  line-height: 1.6;
  margin-bottom: 1rem;
`;

const Emphasis = styled.span`
  color: #ff7e5f;
  font-weight: 600;
`;

const Strong = styled.strong`
  font-weight: 700;
`;

const components = {
  block: {
    normal: ({ children }) => <StyledParagraph>{children}</StyledParagraph>,
  },
  marks: {
    strong: ({ children }) => <Strong>{children}</Strong>,
    em: ({ children }) => <Emphasis>{children}</Emphasis>,
  },
};

const PortableTextComponent = ({ value }) => {
  return <PortableText value={value} components={components} />;
};

export default PortableTextComponent;
