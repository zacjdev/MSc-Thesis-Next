/**
 * This component renders a container for pages
 * @param children - Children elements inside the container
 */
import React, { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
}

const Container: React.FC<ContainerProps> = ({ children }) => {
  return (
    // Container for all pages
    <div className="container mx-auto bg-light-1 dark:bg-dark-1 border-l-2 border-r-2 border-black-400"
    // minimum height 100vh - 80px
    style={ { minHeight: "calc(100vh - 80px)" }}>
      {children}
    </div>
  );
};

export default Container;
