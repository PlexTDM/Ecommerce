import { default as MUIPagination } from "@mui/material/Pagination";
import type { ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";

export interface PaginationProps {
  page: number | string;
  pages: number | string;
}

const Pagination = ({ page, pages }: PaginationProps) => {
  const navigate = useNavigate();

  const handleChange = (_event: ChangeEvent<unknown>, value: number) => {
    void navigate(`/products/${value}`);
  };

  return (
    <div className="w-full my-8 flex justify-center">
      <MUIPagination
        variant="outlined"
        shape="rounded"
        size="large"
        count={Number(pages)}
        page={Number(page)}
        onChange={handleChange}
        siblingCount={3}
        boundaryCount={1}
        sx={{
          "& .Mui-selected": {
            backgroundColor: "#b4b4b4",
            color: "black",
          },
          "& .MuiPaginationItem-root:hover": {
            backgroundColor: "#ddd",
          },
          "& .Mui-selected:hover": {
            backgroundColor: "#a3a3a3",
            color: "black",
          },
        }}
      />
    </div>
  );
};

export default Pagination;
