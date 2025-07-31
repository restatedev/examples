import styled from 'styled-components/macro';

export const Container = styled.div`
  @media only screen and (min-width: ${({ theme: { breakpoints } }) => breakpoints.tablet}) {
  }

  @media only screen and (min-width: ${({ theme: { breakpoints } }) => breakpoints.desktop}) {
  }

  @media (min-width: 1025px) {
    .h-custom {
      height: 100vh !important;
    }
  }

  .horizontal-timeline .items {
    border-top: 2px solid #ddd;
  }

  .horizontal-timeline .items .items-list {
    position: relative;
    margin-right: 0;
  }

  .horizontal-timeline .items .items-list:before {
    content: '';
    position: absolute;
    height: 8px;
    width: 8px;
    border-radius: 50%;
    background-color: #ddd;
    top: 0;
    margin-top: -5px;
  }

  .horizontal-timeline .items .items-list {
    padding-top: 15px;
  }
`;

export const SimpleContainer = styled.div`
  @media only screen and (min-width: ${({ theme: { breakpoints } }) => breakpoints.tablet}) {
  }

  @media only screen and (min-width: ${({ theme: { breakpoints } }) => breakpoints.desktop}) {
  }

  @media (min-width: 1025px) {
    .h-custom {
      height: 100vh !important;
    }
  }

  display: inline-block;
  color: #c0c0c0;
`;

export const Tobedone = styled.p`
  color: #c0c0c0;
`;

export const Done = styled.span`
  color: #42b015;
`;

export const Bold = styled.p`
  font-weight: 600;
`;
