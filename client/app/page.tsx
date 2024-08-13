'use client';
import React, {FC, useState} from "react";
import Heading from "./utils/heading";
import Header from "./components/header";
interface PageProps {
  
}
const Page: FC<PageProps> = (props) => {
  const [open, setOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(0);
   return (
    <div>
      <Heading title="Eplatform" description="Page description duh" keywords="duh, bro, brainrot" 
      />
      <Header
      open = {open}
      setOpen = {setOpen}
      activeItem = {activeItem}
      />
    </div>
    
  );
};

export default Page;