import React, { useState } from "react";
import { Backdrop, CircularProgress } from "@mui/material";

const useFullPageLoader = () => {
    const [isLoading, setIsLoading] = useState(false);
    const loaderElement = (
        <Backdrop
            sx={{
                color: "#fff",
                zIndex:9999,
            }}
            open={isLoading}
        >
            <CircularProgress color="inherit" />
        </Backdrop>
    );

    return { setIsLoading, loaderElement };
};
export default useFullPageLoader