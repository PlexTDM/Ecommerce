import { Swiper, SwiperSlide } from "swiper/react";
import { Controller, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const images = [
    "/poster0.jpg",
    "/poster1.jpg",
    "/poster8.jpg",
    "/poster9.jpg",
];

const Carousel = () => {
    return (
        <div className="w-full flex h-[350px] gap-4">
            <div className="max-w-5xl">
                <Swiper
                    modules={[Controller, Pagination, Autoplay]}
                    spaceBetween={20}
                    slidesPerView={1}
                    loop={true}
                    autoplay={{ delay: 7000 }}
                    pagination={{ clickable: true }}
                    className="rounded-lg shadow-lg h-full"
                >
                    {images.map((img, index) => (
                        <SwiperSlide key={index}>
                            <img
                                src={img}
                                alt={`Slide ${index + 1}`}
                                className="w-full object-cover rounded-lg"
                            />
                        </SwiperSlide>
                    ))}
                </Swiper></div>
            <div className="grid grid-row-3 grid-flow-row justify-between *:object-cover *:w-full rounded-lg overflow-hidden gap-2 overflow-y-scroll snap-y *:snap-center">
                <img src="/poster3.jpg" />
                <img src="/poster4.jpg" />
                <img src="/poster5.jpg" />
                <img src="/poster6.jpg" />
                <img src="/poster7.jpg" />
                <img src="/poster2.png" />
            </div>
        </div>
    );
};

export default Carousel;
