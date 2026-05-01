import React from 'react';
import styled from 'styled-components';
import Loader from './Loader';

const StyledLoadingScreen = styled.div`
  width: 100%;
  padding: 0 1.5rem;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  background-color: hsla(39, 23%, 14%, 1.00);
`;

const LoadingScreen = () => (
  <StyledLoadingScreen>
    <Loader />
  </StyledLoadingScreen>
);

export default LoadingScreen;
