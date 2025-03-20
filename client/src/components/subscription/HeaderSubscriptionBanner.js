import React from "react";
import styled from "styled-components";
import SubscribeBanner from "../notifications/SubscribeBanner";

const HeaderSubscriptionBanner = () => {
  return (
    <BannerWrapper>
      <SubscribeBanner />
    </BannerWrapper>
  );
};

const BannerWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  
  @media (max-width: 768px) {
    padding: 0 1rem;
  }
  
  /* Override the original banner's margin to fit nicely below header */
  > div:first-child {
    margin-top: 1rem;
    margin-bottom: 1rem;
  }
`;

export default HeaderSubscriptionBanner;