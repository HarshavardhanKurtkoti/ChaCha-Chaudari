import React, { useState } from 'react';

const images = [
  '/assets/images/namamigange1.jpg',
  '/assets/images/namamigange2.jpg',
  '/assets/images/namamigange4.jpg',
  '/assets/images/namamigange5.jpg',
];

const CarouselComp = () => {
  const [current, setCurrent] = useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 3000); // Change slide every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
  <div className="relative w-full h-[450px] max-h-[500px] flex items-center justify-center">
      <button
        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/70 rounded-full px-3 py-1 shadow hover:bg-white"
        onClick={prevSlide}
        aria-label="Previous"
      >
        &#8592;
      </button>
      <img
        src={images[current]}
        alt={`Ganga ${current + 1}`}
        loading="lazy"
        className="rounded-2xl object-cover w-full h-full shadow-lg"
      />
      <button
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/70 rounded-full px-3 py-1 shadow hover:bg-white"
        onClick={nextSlide}
        aria-label="Next"
      >
        &#8594;
      </button>
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
        {images.map((_, idx) => (
          <span
            key={idx}
            className={`w-3 h-3 rounded-full ${idx === current ? 'bg-blue-600' : 'bg-gray-300'}`}
          />
        ))}
      </div>
    </div>
  );
};

export default CarouselComp;
