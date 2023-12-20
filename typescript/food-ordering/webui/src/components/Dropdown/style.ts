import styled from 'styled-components/macro';

export {};

export const DescriptionP = styled.p`
   {
    color: white;
  }
`;

export const DropdownDiv = styled.div`
  .dropdown {
    position: relative;
  }

  .menu {
    position: absolute;

    list-style-type: none;
    margin: 5px 0;
    padding: 0;

    border: 1px solid grey;
    width: 200px;
  }

  .menu > li {
    margin: 0;

    background-color: white;
  }

  .menu > li:hover {
    background-color: lightgray;
  }

  .menu > li > button {
    width: 100%;
    height: 100%;
    text-align: left;

    background: none;
    color: inherit;
    border: none;
    padding: 5px;
    margin: 0;
    font: inherit;
    cursor: pointer;
  }
`;
