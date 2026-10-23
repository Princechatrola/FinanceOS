import { TrendingUp } from "lucide-react";

function AdminStatCard({
  title,
  value,
  description,
  icon: Icon,
  change,
}) {
  return (
    <div
      className="
        rounded-2xl
        border border-[#dfe6da]
        bg-white
        p-5
        shadow-[0_4px_18px_rgba(45,75,50,0.04)]
      "
    >
      {/* TOP */}
      <div className="flex items-start justify-between">

        {/* ICON */}
        <div
          className="
            flex h-12 w-12
            items-center justify-center
            rounded-xl
            bg-[#edf5e8]
            text-[#43822e]
          "
        >
          {Icon && <Icon size={22} />}
        </div>

        {/* CHANGE */}
        {change && (
          <div className="flex items-center gap-1 text-xs font-semibold text-[#43822e]">
            <TrendingUp size={13} />
            {change}
          </div>
        )}

      </div>

      {/* CONTENT */}
      <div className="mt-4">
        <p className="text-sm font-medium text-[#66786d]">
          {title}
        </p>

        <h3 className="mt-1 text-[28px] font-bold leading-none text-[#173b2b]">
          {value}
        </h3>

        <p className="mt-2 text-xs text-[#89968e]">
          {description}
        </p>
      </div>
    </div>
  );
}

export default AdminStatCard;