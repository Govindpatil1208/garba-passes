import { CONTACT_PHONE, CONTACT_WHATSAPP } from "@/lib/event";

export default function ContactButtons({ className = "" }: { className?: string }) {
  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`}>
      <a href={`tel:+91${CONTACT_PHONE}`} className="btn-dark">📞 CALL US</a>
      <a
        href={`https://wa.me/91${CONTACT_WHATSAPP}`}
        target="_blank"
        rel="noopener noreferrer"
        className="btn bg-[#1FA855] text-white hover:bg-[#188a45]"
      >
        💬 WHATSAPP
      </a>
    </div>
  );
}
