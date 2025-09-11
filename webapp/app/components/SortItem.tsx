'use client';
import { Button} from "@chakra-ui/react";
import { forwardRef, useCallback } from "react";


export const Item = ({ isDragOverlay, isDragging, ...props }) => {
    const handleClick = useCallback(() => {
      console.info(`onClick: ${props.id} [${Date.now()}]`);
    }, [props.id]);
    
    return (
      <Button

        as="a"
        opacity={isDragging ? 0.5 : 1}
        colorScheme={isDragOverlay ? "blue" : "gray"}
        size="sm"
        variant={isDragOverlay ? "solid" : "ghost"}
        onClick={handleClick}
        {...props}
      />
    );
  }

