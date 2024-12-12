import { DescriptionP, DropdownDiv } from './style';
import React from 'react';

interface DropdownProps {
  open: boolean;
  trigger: JSX.Element;
  menu: JSX.Element[];
  dropDownDescription: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  open,
  trigger,
  menu,
  dropDownDescription,
}) => {
  // @ts-ignore
  return (
    <DropdownDiv className="dropdown">
      <DescriptionP>{dropDownDescription}</DescriptionP>
      {trigger}
      {open ? (
        <ul className="menu">
          {menu.map((menuItem, index) => (
            <li key={index} className="menu-item">
              {menuItem}
            </li>
          ))}
        </ul>
      ) : null}
    </DropdownDiv>
  );
};

export default Dropdown;
