import React from 'react';
import styled from 'styled-components';
import theme from '../../styles/theme';

const WatermarkTextWrapper = styled.div`
  position: fixed;
  left: 40vw;
  top: 10vh;
  z-index: -99;
  overflow-x: hidden;
`;

const WatermarkText = () => (
  <WatermarkTextWrapper>
    <svg
      width="1328"
      height="647"
      viewBox="0 0 1328 647"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '80vw', height: '80vh' }}
    >
      <text
        opacity="0.15"
        x="50"
        y="300"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="320"
        fontWeight="bold"
        letterSpacing="20"
        fill={theme.colors.secondaryCta}
      >
        MOSS
      </text>
      <text
        opacity="0.15"
        x="120"
        y="600"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="320"
        fontWeight="bold"
        letterSpacing="20"
        fill={theme.colors.secondaryCta}
      >
        POK
      </text>
    </svg>
  </WatermarkTextWrapper>
);

export default WatermarkText;
