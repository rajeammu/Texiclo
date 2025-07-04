import React, { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { FRONTIMG } from "../assets"; // plain t-shirt image
import { ContactForm } from "./ContactForm";

interface PreviewProps {
  images: string[];
  onClose: () => void;
}

export const Preview: React.FC<PreviewProps> = ({ images, onClose }) => {

  const positions = [
    "left chest",
    "center chest",
    "full front",
    "oversized front",
    "back collar",
    "upper back",
    "full back",
  ];

  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<Record<string, string>>({});
  const [checkedPositions, setCheckedPositions] = useState<Record<string, boolean>>({});
  const [currentSlide, setCurrentSlide] = useState<number>(-1); // -1 shows plain t-shirt
  const [showContactModal, setShowContactModal] = useState(false);

  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

const openContactForm = async () => {
  const blob = await handleSavePDF(false);
  setPdfBlob(blob);
  setShowContactModal(true);
};


  const closeContactForm = () => setShowContactModal(false);
  const previewRef = useRef<HTMLDivElement>(null); // for capturing the preview area

 useEffect(() => {
  setUploadedImages(images);
}, [images]);


  const handleImageSelect = (position: string, imageData: string) => {
    setSelectedImages((prev) => ({
      ...prev,
      [position]: imageData,
    }));
  };

  const handleCheckboxChange = (position: string, checked: boolean) => {
    const updatedChecked = {
      ...checkedPositions,
      [position]: checked,
    };
    setCheckedPositions(updatedChecked);

    const validPositions = getConfiguredPreviews(updatedChecked, selectedImages);

    if (checked && selectedImages[position]) {
      const newIndex = validPositions.indexOf(position);
      setCurrentSlide(newIndex);
    } else if (!checked) {
      const currentPos = getConfiguredPreviews(updatedChecked, selectedImages)[currentSlide];
      if (!currentPos) setCurrentSlide(-1);
    }
  };

  const getConfiguredPreviews = (
    checked = checkedPositions,
    selected = selectedImages
  ) => positions.filter((pos) => checked[pos] && selected[pos]);

  const previews = getConfiguredPreviews();
  const totalSlides = previews.length;
  const currentPosition = currentSlide >= 0 && previews[currentSlide];

  const handlePrev = () => {
    if (totalSlides === 0) return;
    setCurrentSlide((prev) => (prev <= 0 ? totalSlides - 1 : prev - 1));
  };

  const handleNext = () => {
    if (totalSlides === 0) return;
    setCurrentSlide((prev) => (prev >= totalSlides - 1 ? 0 : prev + 1));
  };

  const positionStyles: Record<string, string> = {
    "left chest": "top-[25%] left-[20%]",
    "center chest": "top-[25%] left-[40%]",
    "full front": "top-[20%] left-[20%] w-[60%]",
    "oversized front": "top-[15%] left-[10%] w-[80%]",
    "back collar": "top-[5%] left-[45%]",
    "upper back": "top-[15%] left-[35%]",
    "full back": "top-[20%] left-[20%] w-[60%]",
  };

const handleSavePDF = async (shouldDownload = false): Promise<Blob> => {
  if (!previewRef.current) throw new Error("No preview available");

  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const slides = getConfiguredPreviews();
  const originalSlide = currentSlide;

  const marginX = 30;
  const marginY = 30;
  const spacingY = 20;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const availableHeight = pageHeight - marginY * 2 - spacingY * 2;
  const maxImgHeight = availableHeight / 3;
  const maxImgWidth = pageWidth - marginX * 2;

  let imageCount = 0;

  for (let i = 0; i < slides.length; i++) {
    setCurrentSlide(i);
    await new Promise((resolve) => setTimeout(resolve, 300));

    const canvas = await html2canvas(previewRef.current!, {
      useCORS: true,
      scale: 1.5, // Lower scale to reduce resolution
    });

    // Convert to JPEG with lower quality (0.6)
    const imgData = canvas.toDataURL("image/jpeg", 0.6);

    let imgWidth = maxImgWidth;
    let imgHeight = (canvas.height / canvas.width) * imgWidth;

    if (imgHeight > maxImgHeight) {
      imgHeight = maxImgHeight;
      imgWidth = (canvas.width / canvas.height) * imgHeight;
    }

    const xOffset = (pageWidth - imgWidth) / 2;
    const yOffset = marginY + imageCount * (imgHeight + spacingY);

    pdf.addImage(imgData, "JPEG", xOffset, yOffset, imgWidth, imgHeight);
    imageCount++;

    if (imageCount === 3 && i < slides.length - 1) {
      pdf.addPage();
      imageCount = 0;
    }
  }

  setCurrentSlide(originalSlide);

  if (shouldDownload) {
    pdf.save("tshirt_preview.pdf");
  }

  return pdf.output("blob");
};








  return (
    <div className="flex flex-col items-center p-10">
      <h2 className="text-2xl font-bold mb-6">Preview</h2>

      <div className="flex flex-col md:flex-row gap-20 w-full max-w-5xl mx-auto items-center justify-center">
        {/* Shirt Preview */}
        <div ref={previewRef} className="relative w-[300px] h-[350px]">
          <img
            src={FRONTIMG}
            alt="shirt"
            className="w-full h-full object-contain rounded shadow border"
          />

          {/* Overlay image if a slide is active */}
          {currentPosition && selectedImages[currentPosition] && (
            <img
              src={selectedImages[currentPosition]}
              alt={currentPosition}
              className={`absolute ${positionStyles[currentPosition]} h-16 object-contain`}
            />
          )}

          {/* Carousel Controls */}
          {totalSlides > 0 && (
            <div className="flex justify-center gap-8 mt-6 absolute bottom-[-60px] left-1/2 transform -translate-x-1/2">
              <ChevronLeft size={24} onClick={handlePrev} className="cursor-pointer" />
              <div className="flex items-center gap-3">
                {previews.map((_, index) => (
                  <span
                    key={index}
                    className={`w-2 h-2 rounded-full inline-block ${
                      index === currentSlide ? "bg-black" : "bg-gray-400"
                    }`}
                  />
                ))}
              </div>
              <ChevronRight size={24} onClick={handleNext} className="cursor-pointer" />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-2 text-left w-full max-w-md">
          {positions.map((pos, index) => (
            <div
              key={index}
              className="flex flex-col sm:flex-row justify-between items-center sm:items-center gap-2"
            >
              <label className="flex items-center gap-2 text-lg">
                <input
                  type="checkbox"
                  onChange={(e) => handleCheckboxChange(pos, e.target.checked)}
                  checked={checkedPositions[pos] || false}
                />
                {pos}
              </label>

              <select
                className="border rounded px-2 py-1"
                onChange={(e) => handleImageSelect(pos, e.target.value)}
                value={selectedImages[pos] || ""}
              >
                <option value="">Select image</option>
                {uploadedImages.map((img, idx) => (
                  <option key={idx} value={img}>
                    Image {idx + 1}
                  </option>
                ))}
              </select>

              {selectedImages[pos] && (
                <img
                  src={selectedImages[pos]}
                  alt={`Preview for ${pos}`}
                  className="w-16 h-16 object-cover rounded border"
                />
              )}
            </div>
          ))}

          {/* Action Buttons */}
          <div className="flex gap-4 mt-4">
            <button
  onClick={() => handleSavePDF(true)}
  className="bg-yellow-400 px-6 py-2 rounded font-semibold shadow"
>
  Save as PDF
</button>

            <button
          onClick={openContactForm}
          className="bg-yellow-400 px-6 py-2 rounded font-semibold shadow"
        >
          Contact for purchasing
        </button>
          </div>
           {showContactModal && pdfBlob && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white p-6 rounded-lg w-[90%] max-w-lg relative">
      <ContactForm
        onClose={closeContactForm}
        requireScreenshot={false}
        pdfBlob={pdfBlob} // Pass blob here
      />
    </div>
  </div>
)}

        </div>
      </div>
    </div>
  );
};
