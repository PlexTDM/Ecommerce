import { Skeleton } from "@mui/material"

const ProductLoading = () => {
    return (
        <div className=" border border-gray-200 min-h-[300px] rounded shadow-sm">
            <Skeleton height={240} variant="rectangular" />

            <div className="p-4">
                <div className="mt-4">
                    <Skeleton width="80%" height={20} />
                </div>

                <div className="mt-2">
                    <Skeleton width="50%" height={20} />
                </div>

                <div className="mt-2 flex items-center gap-2">
                    <Skeleton width="30%" height={20} />
                    <Skeleton width="20%" height={20} />
                </div>

                <div className="mt-2">
                    <Skeleton width="40%" height={20} />
                </div>
            </div>
        </div>
    )
}

export default ProductLoading