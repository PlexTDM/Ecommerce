import { Swiper, SwiperSlide } from "swiper/react";
import { Controller, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const images = ["/poster0.jpg", "/poster1.jpg", "/poster8.jpg", "/poster9.jpg"];

const thumbnails = [
  "/poster3.jpg",
  "/poster4.jpg",
  "/poster5.jpg",
  "/poster6.jpg",
  "/poster7.jpg",
  "/poster2.png",
];

const Carousel = () => {
  return (
    <div className="flex h-87.5 w-full gap-4">
      <div className="min-w-0 max-w-5xl flex-1">
        <Swiper
          modules={[Controller, Pagination, Autoplay]}
          spaceBetween={20}
          slidesPerView={1}
          loop={true}
          autoplay={{ delay: 7000 }}
          pagination={{ clickable: true }}
          className="h-full w-full rounded-lg shadow-lg"
        >
          {images.map((img, index) => (
            <SwiperSlide key={index} className="h-full">
              <img
                src={img}
                alt={`Featured anime banner ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <div
        aria-hidden="true"
        className="hidden w-36 shrink-0 snap-y grid-flow-row gap-2 overflow-y-scroll rounded-lg *:w-full *:snap-center *:object-cover lg:grid lg:w-44"
      >
        {thumbnails.map((img) => (
          <img key={img} src={img} alt="" loading="lazy" />
        ))}
      </div>
    </div>
  );
};

export default Carousel;
