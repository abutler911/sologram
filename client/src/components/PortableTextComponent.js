import { PortableText } from "@portabletext/react";
import styled from "styled-components";

// Paragraph styling
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

// Emphasized (italic) text
const Emphasis = styled.span`
  color: #ff7e5f;
  font-weight: 600;
`;

// Heading 2 styling
const StyledHeading2 = styled.h2`
  color: #ddd;
  font-size: 1.8rem;
  margin: 2rem 0 1rem;
`;

// Responsive image + text wrapper
const ImageTextWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 2rem;
`;

// Styled image
const StyledImage = styled.img`
  width: 300px;
  max-width: 100%;
  height: auto;
  border-radius: 12px;
  flex-shrink: 0;
`;

// Portable Text component overrides
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
      <ImageTextWrapper>
        <StyledImage src={value.asset.url} alt={value.alt || "Image"} />
        {/* You can optionally add more text here if you want text beside the image */}
      </ImageTextWrapper>
    ),
  },
};

const PortableTextComponent = ({ value }) => {
  return <PortableText value={value} components={components} />;
};

export default PortableTextComponent;
