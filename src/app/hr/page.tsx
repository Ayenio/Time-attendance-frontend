import Link from "next/link";
import { TodayAttendance } from "@/components/hr/TodayAttendance";
import { TodayDate } from "@/components/hr/TodayDate";

export default function HrToday() {
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Today</h1>
          <TodayDate />
        </div>
        <Link
          href="/hr/employees"
          className="px-5 py-3 rounded-2xl bg-primary text-white font-semibold text-sm shadow-lg shadow-blue-200 hover:bg-primary-hover"
        >
          Add employee
        </Link>
      </div>
      <TodayAttendance />
    </>
  );
}