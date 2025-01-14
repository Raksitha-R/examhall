import React, { useEffect, useState } from "react";
import { db } from "./firebase"; // Import Firebase configuration
import { ref, onValue } from "firebase/database";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { Link } from 'react-router-dom'; // Import Link from react-router-dom

function Timetable() {
  const [halls, setHalls] = useState([]);
  const [selectedHalls, setSelectedHalls] = useState([]);
  const [staff, setStaff] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState([]); // State for selected staff
  const [datesAndSessions, setDatesAndSessions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [confirmedSessions, setConfirmedSessions] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [isGenerated, setIsGenerated] = useState(false);
  const [totalStrength, setTotalStrength] = useState(""); // Leave empty by default

  useEffect(() => {
    const hallsRef = ref(db, "venues/");
    onValue(hallsRef, (snapshot) => {
      const data = snapshot.val();
      setHalls(data ? Object.values(data).map((hall) => hall) : []);
    });

    const staffRef = ref(db, "staff/");
    onValue(staffRef, (snapshot) => {
      const data = snapshot.val();
      setStaff(
        data
          ? Object.values(data).map((staff) => ({ name: staff.name, duties: {} }))
          : []
      );
    });

    const datesessionsRef = ref(db, "datesessions/");
    onValue(datesessionsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Include both true and false sessions
        const formattedData = Object.values(data).flatMap((entry) => {
          const date = entry.date;
          const sessions = entry.sessions;

          return Object.keys(sessions).map((slot) => ({
            date,
            session: slot,
            isTrue: sessions[slot] === true,
          }));
        });
        setDatesAndSessions(formattedData);
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

  const handleStaffChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setSelectedStaff((prev) => [...prev, value]);
    } else {
      setSelectedStaff((prev) => prev.filter((staffName) => staffName !== value));
    }
  };

  const handleSelectAllStaff = (e) => {
    if (e.target.checked) {
      setSelectedStaff(staff.map(staffMember => staffMember.name)); // Select all staff
    } else {
      setSelectedStaff([]); // Deselect all staff
    }
  };

  const confirmHalls = () => {
    const currentSession = datesAndSessions[currentIndex];

    // Only confirm halls if it's a true session
    if (currentSession.isTrue) {
      const confirmedSession = {
        date: currentSession.date,
        session: currentSession.session,
        halls: selectedHalls,
      };
      setConfirmedSessions((prev) => [...prev, confirmedSession]);
      setSelectedHalls([]); // Reset selected halls
      setTotalStrength(""); // Reset total strength
    }

    // Automatically move to the next session
    setCurrentIndex((prev) => prev + 1);
  };

  const formatDate = (date) => {
    const [year, month, day] = date.split("-");
    return `${parseInt(day)}-${parseInt(month)}-${year}`;
  };

  // Calculate total capacity of selected halls
  const calculateTotalCapacity = () => {
    return selectedHalls.reduce((total, hallName) => {
      const hallData = halls.find(hall => hall.hall === hallName);
      return total + (hallData ? hallData.capacity : 0); // Assuming each hall has a 'capacity' property
    }, 0);
  };

  // Check if the confirm button should be enabled
  const isConfirmEnabled = calculateTotalCapacity() >= (totalStrength || 0);

  const generateTimetable = () => {
    const staffAllocation = [...staff].filter(staffMember =>
      selectedStaff.includes(staffMember.name)
    );
  
    // Create a map to track the number of duties assigned to each staff member
    const dutyCount = {};
    staffAllocation.forEach(member => {
      dutyCount[member.name] = Object.keys(member.duties).reduce((count, date) => {
        return count + Object.keys(member.duties[date]).length;
      }, 0);
    });
  
    confirmedSessions.forEach(({ date, session, halls }) => {
      halls.forEach((hall) => {
        // Find the staff member with the least duties
        if (staffAllocation.length > 0) {
          const staffMember = staffAllocation.sort(
            (a, b) => dutyCount[a.name] - dutyCount[b.name]
          )[0];
          
          if (!staffMember.duties[date]) {
            staffMember.duties[date] = {};
          }
  
          staffMember.duties[date][session] = hall;
  
          // Increment the duty count for this staff member
          dutyCount[staffMember.name]++;
        }
      });
    });
  
    // Fill in false sessions with "-"
    datesAndSessions.forEach(({ date, session }) => {
      staffAllocation.forEach(staffMember => {
        if (!staffMember.duties[date]) {
          staffMember.duties[date] = {};
        }
        
        if (!staffMember.duties[date][session]) {
          staffMember.duties[date][session] = "-";
        }
      });
    });
  
    setTimetable(staffAllocation);
    setIsGenerated(true);
  };
  

  const downloadTimetablePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(8); // Reduced font size

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
    const timingTextX =
      (doc.internal.pageSize.getWidth() - timingTextWidth) / 2;
    doc.text(timingInfo, timingTextX, 30);

    const headers = [
      "Name of Invigilators",
      ...datesAndSessions.map(({ date, session }) => `${formatDate(date)}\n${session}`), // Modified to show date and session in separate lines
    ];

    const body = timetable.map((entry) => [
      entry.name,
      ...datesAndSessions.map(({ date, session }) => entry.duties[date]?.[session]),
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
        cellPadding: { top: 2 },
        overflow: 'linebreak',
        halign: 'center',
        valign: 'middle',
      },
    });

    doc.save("timetable.pdf");
  };

  return (
    <div className="min-h-screen bg-purple-100">
      <nav className="bg-purple-500 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold mx-auto">Exam Timetable</h1>
          <div>
            <Link to="/home" className="bg-white text-purple-500 px-4 py-2 rounded mr-2">Home</Link>
            <Link to="/form" className="bg-white text-purple-500 px-4 py-2 rounded">Form</Link>
          </div>
        </div>
      </nav>
      
      <div className="max-w-4xl mx-auto p-6 bg-white w-full shadow-lg rounded-lg mt-6">
        {currentIndex < datesAndSessions.length ? (
          <>
            <h2 className="text-xl font-semibold mb-4">
              Select Halls for {formatDate(datesAndSessions[currentIndex].date)} - {datesAndSessions[currentIndex].session}
            </h2>
            {datesAndSessions[currentIndex].isTrue && (
              <>
                <div className="mb-4">
                  <label className="block mb-1">Total Strength:</label>
                  <input
                    type="number"
                    value={totalStrength}
                    onChange={(e) => setTotalStrength(e.target.value)} // Keep it as a string for empty default
                    className="border border-gray-300 rounded px-2 py-1 w-full"
                    placeholder="" // Leave empty by default
                  />
                </div>
                <form className="mb-6">
                  <div className="space-y-2">
                    {halls.map((hall, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          value={hall.hall}
                          onChange={handleHallChange}
                          checked={selectedHalls.includes(hall.hall)}
                          className="mr-2"
                        />
                        <label>{hall.hall} - Capacity: {hall.capacity}</label>
                      </div>
                    ))}
                  </div>
                  {/* Display remaining capacity needed */}
                  <p className="mt-2">
                    Remaining Capacity Needed: {Math.max(0, totalStrength - calculateTotalCapacity())}
                  </p>
                  <button
                    type="button"
                    onClick={confirmHalls}
                    disabled={!isConfirmEnabled} // Enable button based on capacity check
                    className={`bg-violet-500 text-white px-4 py-2 rounded mt-4 w-full ${!isConfirmEnabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    Confirm Halls
                  </button>
                </form>
              </>
            )}
            {/* Automatically move to the next session for false ones */}
            {!datesAndSessions[currentIndex].isTrue && confirmHalls()}
          </>
        ) : (
          <>
            {/* Staff Selection Section */}
            <div className="flex items-center mb-4">
              <h2 className="text-xl font-semibold mr-3">Select Staff for Duty</h2>
              <input 
                type="checkbox" 
                onChange={handleSelectAllStaff} 
                checked={selectedStaff.length === staff.length && staff.length > 0} 
                className="mr-1"
              />
              <label>Select All Staff</label>
            </div>
            
            <form className="mb-6">
              <div className="space-y-2">
                {staff.map((staffMember, index) => (
                  <div key={index} className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      value={staffMember.name}
                      onChange={handleStaffChange}
                      checked={selectedStaff.includes(staffMember.name)}
                      className="mr-2"
                    />
                    <label>{staffMember.name}</label>
                  </div>
                ))}
              </div>

              {/* Added space between staff names and the button */}
              <div style={{ marginBottom: '20px' }}></div>

              <button
                type="button"
                onClick={generateTimetable}
                disabled={selectedStaff.length === 0} // Disable if no staff is selected
                className={`bg-green-500 text-white px-4 py-2 rounded w-full ${selectedStaff.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Generate Timetable
              </button>
            </form>
          </>
        )}

        {isGenerated && (
          <div>
            <h2 className="text-xl font-semibold mb-4 text-purple-400">
              Generated Timetable
            </h2>
            <div className="overflow-x-auto">
              <table className="table-auto w-full max-w-full border-collapse border border-gray-300 text-xs">
                <thead>
                  <tr>
                    <th className="border px-4 py-2">Staff Name</th>
                    {datesAndSessions.map(({ date, session }) => (
                      <th key={`${date}-${session}`}>
                        {formatDate(date)}<br />{session} {/* Show date and session in separate lines */}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timetable.map((entry, index) => (
                    <tr key={index}>
                      <td className="border px-4 py-2">{entry.name}</td>
                      {datesAndSessions.map(({ date, session }) => (
                        <td key={`${date}-${session}`} className="border px-4 py-2 text-center">
                          {entry.duties[date]?.[session]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              onClick={downloadTimetablePDF}
              className="bg-blue-500 text-white px-4 py-2 rounded mt-4 w-full"
            >
              Download Timetable as PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Timetable;
