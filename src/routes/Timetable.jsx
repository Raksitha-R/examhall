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
    // Fetch halls
    const hallsRef = ref(db, "venues/");
    onValue(hallsRef, (snapshot) => {
      const data = snapshot.val();
      setHalls(data ? Object.values(data).map((hall) => hall.hall) : []);
    });

    // Fetch staff
    const staffRef = ref(db, "staff/");
    onValue(staffRef, (snapshot) => {
      const data = snapshot.val();
      setStaff(
        data
          ? Object.values(data).map((staff) => ({ name: staff.name, duties: 0 }))
          : []
      );
    });

    // Fetch dates and sessions
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

    // Calculate required number of staff for all selected halls
    const totalHallsPerSession = selectedHalls.length;
    const maxSlotsPerDay = datesAndSlots.reduce(
      (acc, { slots }) => acc + slots.length,
      0
    );
    const requiredStaffCount = totalHallsPerSession * maxSlotsPerDay;

    // Check if there are enough staff members and each staff has enough capacity (3 sessions max)
    const maxTotalSessions = staff.length * 3; // Each staff can handle 3 sessions
    if (requiredStaffCount > maxTotalSessions) {
      alert("Not enough staff members available to allocate all halls for each session (3 sessions per staff).");
      return;
    }

    const generatedTimetable = staff.map((member) => ({
      name: member.name,
      duties: datesAndSlots.reduce((acc, { date, slots }) => {
        acc[date] = {};
        slots.forEach((slot) => {
          acc[date][slot] = null;  // Initially no hall is assigned
        });
        return acc;
      }, {}),
      sessionCount: 0, // Track the number of sessions assigned to each staff member
    }));

    const assignedHallsPerSession = {}; // { date: { slot: [assignedHalls] } }

    for (const { date, slots } of datesAndSlots) {
      for (const slot of slots) {
        if (!assignedHallsPerSession[date]) {
          assignedHallsPerSession[date] = {};
        }
        if (!assignedHallsPerSession[date][slot]) {
          assignedHallsPerSession[date][slot] = [];
        }

        // Ensure all halls are assigned for the session
        for (const hall of selectedHalls) {
          // Skip if the hall has already been assigned to a staff member in this session
          if (assignedHallsPerSession[date][slot].includes(hall)) {
            continue;
          }

          // Get the list of staff who have fewer than 3 sessions
          const availableStaff = generatedTimetable.filter(
            (member) => member.sessionCount < 3
          );

          if (!availableStaff.length) {
            alert(`Not enough staff members available to allocate all halls on ${date} ${slot}.`);
            return;
          }

          // Try to distribute duties as evenly as possible
          let selectedStaff;
          let minSessions = Math.min(...availableStaff.map(member => member.sessionCount));
          const staffWithMinSessions = availableStaff.filter(
            (member) => member.sessionCount === minSessions
          );

          // Randomly select a staff member from those with the minimum sessions
          const randomIndex = Math.floor(Math.random() * staffWithMinSessions.length);
          selectedStaff = staffWithMinSessions[randomIndex];

          // Find the staff index in the generated timetable
          const staffIndex = generatedTimetable.findIndex(
            (entry) => entry.name === selectedStaff.name
          );

          // Assign the hall to the selected staff for the specific date and slot
          generatedTimetable[staffIndex].duties[date][slot] = hall;

          // Mark this hall as assigned for this date and slot
          assignedHallsPerSession[date][slot].push(hall);

          // Increment the staff's session count
          generatedTimetable[staffIndex].sessionCount += 1;
        }
      }
    }

    setTimetable(generatedTimetable);
    setIsGenerated(true);
  };

  // Download timetable as PDF
  const downloadTimetablePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(10); // Adjust the font size

    // Title and college details
    const headerText = [
      "THIAGARAJAR COLLEGE OF ENGINEERING, MADURAI-15",
      "DEPARTMENT OF INFORMATION TECHNOLOGY",
      "Continuous Assessment Test-I1 (2024-2025) ODD Semester",
      "Invigilation Chart – 3rd Semester",
    ];

    // Center align header text
    headerText.forEach((line, index) => {
      const pageWidth = doc.internal.pageSize.getWidth();
      const textWidth = doc.getStringUnitWidth(line) * doc.internal.getFontSize() / doc.internal.scaleFactor;
      const textX = (pageWidth - textWidth) / 2;
      doc.text(line, textX, 10 + index * 5); // Adjust the Y-position incrementally
    });

    // Add timing information above the timetable
    const timingInfo = "Slot 1: 09.30 am to 1.15 pm   &   Slot 3: 02.30 pm to 4.15 pm";
    const timingTextWidth = doc.getStringUnitWidth(timingInfo) * doc.internal.getFontSize() / doc.internal.scaleFactor;
    const timingTextX = (doc.internal.pageSize.getWidth() - timingTextWidth) / 2;
    doc.text(timingInfo, timingTextX, 30);

    // Format the date to "day-month-year" (short year)
    const formatDate = (date) => {
      const [year, month, day] = date.split("-"); // Assume incoming format is "year-month-day"
      const shortYear = year.slice(-2); // Extract last two digits of the year
      return `${parseInt(day)}-${parseInt(month)}-${shortYear}`;
    };

    // Define the table headers and body
    const headers = [
      "Name of Invigilators",
      ...datesAndSlots.map(({ date }) => [
        formatDate(date) + " FN",
        formatDate(date) + " AN",
      ]).flat(),
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

    // Add the timetable table
    doc.autoTable({
      head: [headers],
      body,
      startY: 40, // Start below the timing information
      columnStyles: {
        0: { cellWidth: 37 }, // First column for names
      },
      styles: {
        fontSize: 8, // Adjust font size for table content
      },
    });

    // Save the PDF with the timetable
    doc.save("timetable.pdf");
  };

  return (
    <div className="min-h-screen bg-purple-100"> {/* This sets the outer background to purple */}
      <div className="max-w-4xl mx-auto p-6 bg-purple-50 w-3/4"> {/* Inner content background */}
        <h1 className="text-3xl text-purple-600 font-bold text-center mb-6">Timetable</h1>
    
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
            className="bg-violet-500 text-white px-4 py-2 rounded mt-4"
          >
            Generate Timetable
          </button>
        </form>
    
        {isGenerated && (
          <div>
            <h2 className="text-xl font-semibold mb-4 text-purple-400">Generated Timetable</h2>
            <table className="table-auto w-full border-collapse border border-black-300 bg-purple-50">
              <thead>
                <tr>
                  <th className="border px-4 py-2 text-sm bg-purple-200">S.No</th>
                  <th className="border px-4 py-2 text-sm bg-purple-200">Name of Invigilators</th>
                  {datesAndSlots.map(({ date }) => (
                    <th key={date} colSpan={2} className="border px-4 py-2 text-xs bg-purple-200">
                      {date}
                    </th>
                  ))}
                </tr>
                <tr>
                  <th className="border px-4 py-2 text-xs bg-purple-200"></th>
                  <th className="border px-4 py-2 text-xs bg-purple-200"></th>
                  {datesAndSlots.map(() => (
                    <>
                      <th className="border px-4 py-2 text-sm bg-purple-200">FN</th>
                      <th className="border px-4 py-2 text-sm bg-purple-200">AN</th>
                    </>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timetable.map((staffMember, index) => (
                  <tr key={index}>
                    <td className="border px-4 py-2 text-sm bg-purple-200">{index + 1}</td>
                    <td className="border px-4 py-2 text-sm">{staffMember.name}</td>
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
        )}
    
        {isGenerated && (
          <button
            type="button"
            onClick={downloadTimetablePDF}
            className="bg-green-500 text-white px-4 py-2 rounded mt-4"
          >
            Download Timetable as PDF
          </button>
        )}
      </div>
    </div>
  );
  
  
}

export default Timetable;
