import { PortableText } from "@portabletext/react";
import styled from "styled-components";

// Paragraph styling
const StyledParagraph = styled.p`
  color: #bbb;
  line-height: 1.6;
  margin-bottom: 1rem;
`;

// Bold (orange) text
const Strong = styled.strong`
  font-weight: 700;
  color: #ff7e5f;
`;

// Emphasized (italic/orange) text
const Emphasis = styled.span`
  color: #ff7e5f;
  font-weight: 600;
`;

// Heading 2
const StyledHeading2 = styled.h2`
  color: #ddd;
  font-size: 1.8rem;
  margin: 2rem 0 1rem;
`;

// Image that wraps text
const WrappedImage = styled.img`
  float: left;
  margin: 0 1rem 1rem 0;
  width: 300px;
  max-width: 100%;
  height: auto;
  border-radius: 12px;

  @media (max-width: 768px) {
    float: none;
    display: block;
    margin: 0 auto 1rem;
  }
`;

const components = {
  block: {
    normal: ({ children }) => <StyledParagraph>{children}</StyledParagraph>,
    h2: ({ children }) => <StyledHeading2>{children}</StyledHeading2>,
  },
  marks: {
    strong: ({ children }) => <Strong>{children}</Strong>,
    em: ({ children }) => <Emphasis>{children}</Emphasis>,
  },
  types: {
    image: ({ value }) => (
      <WrappedImage src={value.asset.url} alt={value.alt || "Image"} />
    ),
  },
};

const PortableTextComponent = ({ value }) => {
  return <PortableText value={value} components={components} />;
};

export default PortableTextComponent;
