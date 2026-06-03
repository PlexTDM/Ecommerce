import { default as MUIPagination } from '@mui/material/Pagination'
import { useNavigate } from 'react-router-dom'
const Pagination = ({ page, pages }) => {

    const navigate = useNavigate()

    const handleChange = (e, value) => {
        navigate('/products/' + value)
    }

    return (
        <div className='w-full my-8 flex justify-center'>
            <MUIPagination variant={'outlined'} shape='rounded' size={'large'} count={parseInt(pages)} page={parseInt(page)} onChange={handleChange}
                siblingCount={3} boundaryCount={1}
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
                }} />
        </div>
    )
}

export default Pagination;