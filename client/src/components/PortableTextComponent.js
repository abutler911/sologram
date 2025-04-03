import { PortableText } from "@portabletext/react";
import styled from "styled-components";

// Styled text blocks
const StyledParagraph = styled.p`
  color: #bbb;
  line-height: 1.6;
  margin-bottom: 1rem;
`;

// Orange bold text
const Strong = styled.strong`
  font-weight: 700;
  color: #ff7e5f;
`;

// Emphasized text
const Emphasis = styled.span`
  color: #ff7e5f;
  font-weight: 600;
`;

// Image with float and text wrap
const StyledImageWrapper = styled.div`
  float: left;
  margin: 0 1rem 1rem 0;
  max-width: 300px;

  img {
    width: 100%;
    height: auto;
    border-radius: 12px;
  }
`;

// Utility to strip orange hearts 🧡
const stripHearts = (text) => text.replace(/🧡/g, "");

const components = {
  block: {
    normal: ({ children }) => (
      <StyledParagraph>
        {children.map((child) =>
          typeof child === "string" ? stripHearts(child) : child
        )}
      </StyledParagraph>
    ),
  },
  marks: {
    strong: ({ children }) => <Strong>{children}</Strong>,
    em: ({ children }) => <Emphasis>{children}</Emphasis>,
  },
  types: {
    image: ({ value }) => (
      <StyledImageWrapper>
        <img src={value.asset.url} alt={value.alt || "Image"} />
      </StyledImageWrapper>
    ),
  },
};

const PortableTextComponent = ({ value }) => {
  return <PortableText value={value} components={components} />;
};

export default PortableTextComponent;
