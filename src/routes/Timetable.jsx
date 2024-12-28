import React, { useEffect, useState } from "react";
import { db } from "./firebase"; // Import Firebase configuration
import { ref, onValue } from "firebase/database";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

function Timetable() {
  const [halls, setHalls] = useState([]);
  const [selectedHalls, setSelectedHalls] = useState([]);
  const [staff, setStaff] = useState([]);
  const [datesAndSlots, setDatesAndSlots] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [isGenerated, setIsGenerated] = useState(false);

  useEffect(() => {
    const hallsRef = ref(db, "venues/");
    onValue(hallsRef, (snapshot) => {
      const data = snapshot.val();
      setHalls(data ? Object.values(data).map((hall) => hall.hall) : []);
    });

    const staffRef = ref(db, "staff/");
    onValue(staffRef, (snapshot) => {
      const data = snapshot.val();
      setStaff(
        data
          ? Object.values(data).map((staff) => ({ name: staff.name, duties: 0 }))
          : []
      );
    });

    const datesessionsRef = ref(db, "datesessions/");
    onValue(datesessionsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const formattedData = Object.values(data).map((entry) => {
          const date = entry.date;
          const slots = Object.keys(entry.sessions).filter(
            (slot) => entry.sessions[slot]
          );
          return { date, slots };
        });
        setDatesAndSlots(formattedData);
      }
    });
  }, []);

  const handleHallChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setSelectedHalls((prev) => [...prev, value]);
    } else {
      setSelectedHalls((prev) => prev.filter((hall) => hall !== value));
    }
  };

  const generateTimetable = () => {
    if (!datesAndSlots.length) {
      alert("No dates or slots available to generate the timetable.");
      return;
    }

    const totalHallsPerSession = selectedHalls.length;
    const maxSlotsPerDay = datesAndSlots.reduce(
      (acc, { slots }) => acc + slots.length,
      0
    );
    const requiredStaffCount = totalHallsPerSession * maxSlotsPerDay;

    const maxTotalSessions = staff.length * 3;
    if (requiredStaffCount > maxTotalSessions) {
      alert(
        "Not enough staff members available to allocate all halls for each session (3 sessions per staff)."
      );
      return;
    }

    const generatedTimetable = staff.map((member) => ({
      name: member.name,
      duties: datesAndSlots.reduce((acc, { date, slots }) => {
        acc[date] = {};
        slots.forEach((slot) => {
          acc[date][slot] = null;
        });
        return acc;
      }, {}),
      sessionCount: 0,
    }));

    const assignedHallsPerSession = {};

    for (const { date, slots } of datesAndSlots) {
      for (const slot of slots) {
        if (!assignedHallsPerSession[date]) {
          assignedHallsPerSession[date] = {};
        }
        if (!assignedHallsPerSession[date][slot]) {
          assignedHallsPerSession[date][slot] = [];
        }

        for (const hall of selectedHalls) {
          if (assignedHallsPerSession[date][slot].includes(hall)) {
            continue;
          }

          const availableStaff = generatedTimetable.filter(
            (member) => member.sessionCount < 3
          );

          if (!availableStaff.length) {
            alert(
              `Not enough staff members available to allocate all halls on ${date} ${slot}.`
            );
            return;
          }

          let selectedStaff;
          let minSessions = Math.min(
            ...availableStaff.map((member) => member.sessionCount)
          );
          const staffWithMinSessions = availableStaff.filter(
            (member) => member.sessionCount === minSessions
          );

          const randomIndex = Math.floor(
            Math.random() * staffWithMinSessions.length
          );
          selectedStaff = staffWithMinSessions[randomIndex];

          const staffIndex = generatedTimetable.findIndex(
            (entry) => entry.name === selectedStaff.name
          );

          generatedTimetable[staffIndex].duties[date][slot] = hall;
          assignedHallsPerSession[date][slot].push(hall);
          generatedTimetable[staffIndex].sessionCount += 1;
        }
      }
    }

    setTimetable(generatedTimetable);
    setIsGenerated(true);
  };

  const downloadTimetablePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(10);

    const headerText = [
      "THIAGARAJAR COLLEGE OF ENGINEERING, MADURAI-15",
      "DEPARTMENT OF INFORMATION TECHNOLOGY",
      "Continuous Assessment Test-I1 (2024-2025) ODD Semester",
      "Invigilation Chart – 3rd Semester",
    ];

    headerText.forEach((line, index) => {
      const pageWidth = doc.internal.pageSize.getWidth();
      const textWidth =
        (doc.getStringUnitWidth(line) * doc.internal.getFontSize()) /
        doc.internal.scaleFactor;
      const textX = (pageWidth - textWidth) / 2;
      doc.text(line, textX, 10 + index * 5);
    });

    const timingInfo =
      "Slot 1: 09.30 am to 1.15 pm   &   Slot 3: 02.30 pm to 4.15 pm";
    const timingTextWidth =
      (doc.getStringUnitWidth(timingInfo) * doc.internal.getFontSize()) /
      doc.internal.scaleFactor;
    const timingTextX = (doc.internal.pageSize.getWidth() - timingTextWidth) / 2;
    doc.text(timingInfo, timingTextX, 30);

    const formatDate = (date) => {
      const [year, month, day] = date.split("-");
      const shortYear = year.slice(-2);
      return `${parseInt(day)}-${parseInt(month)}-${shortYear}`;
    };

    const headers = [
      "Name of Invigilators",
      ...datesAndSlots
        .map(({ date }) => [formatDate(date) + " FN", formatDate(date) + " AN"])
        .flat(),
    ];

    const body = timetable.map((entry) => [
      entry.name,
      ...datesAndSlots
        .map(({ date }) => [
          entry.duties[date]["FN"] || "-",
          entry.duties[date]["AN"] || "-",
        ])
        .flat(),
    ]);

    doc.autoTable({
      head: [headers],
      body,
      startY: 40,
      columnStyles: {
        0: { cellWidth: 37 },
      },
      styles: {
        fontSize: 8,
      },
    });

    doc.save("timetable.pdf");
  };

  return (
    <div className="min-h-screen bg-purple-100">
      {/* Navigation Bar */}
      <nav className="bg-purple-500 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold mx-auto" >Exam Timetable</h1>
          <div className="space-x-4">
            <a
              href="./Home"
              className="text-sm bg-white text-purple-600 px-4 py-2 rounded hover:bg-gray-200"
            >
              Home
            </a>
            <a
              href="./Form"
              className="text-sm bg-white text-purple-600 px-4 py-2 rounded hover:bg-gray-200"
            >
              Form
            </a>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6 bg-white w-full shadow-lg rounded-lg mt-6">
        <h2 className="text-xl font-semibold mb-4">Select Halls</h2>
        <form className="mb-6">
          <div className="space-y-2">
            {halls.map((hall, index) => (
              <div key={index} className="flex items-center text-sm">
                <input
                  type="checkbox"
                  value={hall}
                  onChange={handleHallChange}
                  className="mr-2"
                />
                <label>{hall}</label>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={generateTimetable}
            className="bg-violet-500 text-white px-4 py-2 rounded mt-4 w-full"
          >
            Generate Timetable
          </button>
        </form>

        {isGenerated && (
          <div>
            <h2 className="text-xl font-semibold mb-4 text-purple-400">
              Generated Timetable
            </h2>
            <div className="overflow-x-auto">
              <table className="table-auto w-full border-collapse border border-gray-300">
                <thead>
                  <tr>
                    <th className="border px-4 py-2 text-sm bg-purple-200">S.No</th>
                    <th className="border px-4 py-2 text-sm bg-purple-200">
                      Name of Invigilators
                    </th>
                    {datesAndSlots.map(({ date }) => (
                      <th
                        key={date}
                        colSpan={2}
                        className="border px-4 py-2 text-xs bg-purple-200"
                      >
                        {date}
                      </th>
                    ))}
                  </tr>
                  <tr>
                    <th className="border px-4 py-2 text-xs bg-purple-200"></th>
                    <th className="border px-4 py-2 text-xs bg-purple-200"></th>
                    {datesAndSlots.map(() => (
                      <>
                        <th className="border px-4 py-2 text-sm bg-purple-200">
                          FN
                        </th>
                        <th className="border px-4 py-2 text-sm bg-purple-200">
                          AN
                        </th>
                      </>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timetable.map((staffMember, index) => (
                    <tr key={index}>
                      <td className="border px-4 py-2 text-sm bg-purple-200">
                        {index + 1}
                      </td>
                      <td className="border px-4 py-2 text-sm">
                        {staffMember.name}
                      </td>
                      {datesAndSlots.map(({ date }) => (
                        <>
                          <td className="border px-4 py-2 text-sm">
                            {staffMember.duties[date]["FN"] || "-"}
                          </td>
                          <td className="border px-4 py-2 text-sm">
                            {staffMember.duties[date]["AN"] || "-"}
                          </td>
                        </>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {isGenerated && (
          <button
            type="button"
            onClick={downloadTimetablePDF}
            className="bg-green-500 text-white px-4 py-2 rounded mt-4 w-full"
          >
            Download Timetable as PDF
          </button>
        )}
      </div>
    </div>
  );
}

export default Timetable;
