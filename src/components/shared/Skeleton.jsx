// src/components/shared/Skeleton.jsx

// Dùng animate-pulse của Tailwind để tạo hiệu ứng nhấp nháy
const Skeleton = ({ className = "" }) => {
  return <div className={`bg-gray-800 rounded-md animate-pulse ${className}`} />;
};

export default Skeleton;