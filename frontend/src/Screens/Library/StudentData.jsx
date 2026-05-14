
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import debounce from "lodash/debounce";
import { toast } from "react-hot-toast";
import { FiSearch, FiBookOpen, FiRefreshCw, FiUsers } from "react-icons/fi";
import { baseApiURL } from "../../baseUrl";

const StudentData = () => {
  const [studentQuery, setStudentQuery] = useState("");
  const [studentResults, setStudentResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [bookQuery, setBookQuery] = useState("");
  const [bookResults, setBookResults] = useState([]);
  const [booksToAssign, setBooksToAssign] = useState([]);
  const [issuedBooks, setIssuedBooks] = useState([]);
  const [booksToReturn, setBooksToReturn] = useState(() => new Set());
  const [bookCheckQuery, setBookCheckQuery] = useState("");
  const [bookCheckResults, setBookCheckResults] = useState([]);
  const [studentsWithBook, setStudentsWithBook] = useState([]);
  const [showBookCheck, setShowBookCheck] = useState(false);
  const [borrowerSummary, setBorrowerSummary] = useState([]);
  const [borrowerMeta, setBorrowerMeta] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [activePanel, setActivePanel] = useState("issue");

  const fetchBorrowerSummary = () => {
    setSummaryLoading(true);
    axios
      .get(`${baseApiURL()}/library/borrowerSummary`)
      .then((res) => {
        if (res.data.success) {
          setBorrowerSummary(res.data.borrowers || []);
          setBorrowerMeta(res.data.meta || null);
        }
      })
      .catch((error) =>
        toast.error(error.response?.data?.message || "Unable to load borrower insights")
      )
      .finally(() => setSummaryLoading(false));
  };

  useEffect(() => {
    fetchBorrowerSummary();
  }, []);

  const loadIssuedBooks = (enrollmentNo) => {
    if (!enrollmentNo) return;
    axios
      .get(`${baseApiURL()}/student/details/getDetailsByEnrollment`, {
        params: { enrollmentNo },
      })
      .then((res) => {
        const issued =
          res.data.user?.[0]?.books?.filter((book) => book.status === "issued") || [];
        setIssuedBooks(issued);
        setBooksToReturn(new Set());
      })
      .catch((error) => console.error(error));
  };

  const fetchStudents = useMemo(
    () =>
      debounce(async (query) => {
        if (!query) {
          setStudentResults([]);
          return;
        }
        try {
          const res = await axios.get(`${baseApiURL()}/student/details/search`, {
            params: { query },
          });
          setStudentResults(res.data.students || []);
        } catch (error) {
          console.error(error);
        }
      }, 300),
    []
  );

  const fetchBooks = useMemo(
    () =>
      debounce(async (query) => {
        if (!query) {
          setBookResults([]);
          return;
        }
        try {
          const res = await axios.get(`${baseApiURL()}/library/search`, {
            params: { query },
          });
          setBookResults(res.data.books || []);
        } catch (error) {
          console.error(error);
        }
      }, 300),
    []
  );

  const checkBookBorrowers = useMemo(
    () =>
      debounce(async (query) => {
        if (!query) {
          setBookCheckResults([]);
          setStudentsWithBook([]);
          return;
        }
        try {
          const res = await axios.get(`${baseApiURL()}/library/search`, {
            params: { query },
          });
          const matches = res.data.books || [];
          setBookCheckResults(matches);
          if (matches.length > 0) {
            const bookId = matches[0]._id;
            const studentRes = await axios.get(
              `${baseApiURL()}/student/details/findByBook`,
              { params: { bookId } }
            );
            setStudentsWithBook(studentRes.data.students || []);
          } else {
            setStudentsWithBook([]);
          }
        } catch (error) {
          console.error(error);
          setStudentsWithBook([]);
        }
      }, 400),
    []
  );

  useEffect(() => {
    return () => {
      fetchStudents.cancel();
      fetchBooks.cancel();
      checkBookBorrowers.cancel();
    };
  }, [fetchStudents, fetchBooks, checkBookBorrowers]);
  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setStudentQuery(`${student.firstName} ${student.lastName}`.trim());
    setStudentResults([]);
    setBooksToAssign([]);
    setBookQuery("");
    setBookResults([]);
    loadIssuedBooks(student.enrollmentNo);
  };

  const toggleAssignBook = (book) => {
    setBooksToAssign((prev) => {
      if (prev.find((item) => item._id === book._id)) {
        return prev.filter((item) => item._id !== book._id);
      }
      return [...prev, book];
    });
  };

  const removeAssignedBook = (bookId) => {
    setBooksToAssign((prev) => prev.filter((item) => item._id !== bookId));
  };

  const toggleReturnSelection = (bookId) => {
    if (!bookId) return;
    setBooksToReturn((prev) => {
      const next = new Set(prev);
      if (next.has(bookId)) {
        next.delete(bookId);
      } else {
        next.add(bookId);
      }
      return next;
    });
  };

  const assignBooks = async () => {
    if (!selectedStudent) {
      toast.error("Select a student first");
      return;
    }
    if (booksToAssign.length === 0) {
      toast.error("Choose at least one book to assign");
      return;
    }
    try {
      toast.loading("Assigning books...");
      const res = await axios.post(`${baseApiURL()}/student/details/assignBooks`, {
        enrollmentNo: selectedStudent.enrollmentNo,
        bookIds: booksToAssign.map((book) => book._id),
      });
      toast.dismiss();
      if (res.data.success) {
        toast.success(res.data.message || "Books assigned");
        setBooksToAssign([]);
        setBookQuery("");
        setBookResults([]);
        loadIssuedBooks(selectedStudent.enrollmentNo);
        fetchBorrowerSummary();
      } else {
        toast.error(res.data.message || "Assignment failed");
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || "Assignment failed");
    }
  };

  const returnSelectedBooks = async () => {
    if (!selectedStudent) {
      toast.error("Select a student first");
      return;
    }
    if (booksToReturn.size === 0) {
      toast.error("Select books to return");
      return;
    }
    const ids = Array.from(booksToReturn);
    const confirmReturn = window.confirm(
      `Return ${ids.length} book(s) from ${selectedStudent.firstName}?`
    );
    if (!confirmReturn) return;
    try {
      toast.loading("Processing return...");
      const res = await axios.post(`${baseApiURL()}/student/details/returnBooks`, {
        enrollmentNo: selectedStudent.enrollmentNo,
        bookIds: ids,
      });
      toast.dismiss();
      if (res.data.success) {
        toast.success(res.data.message || "Books returned");
        loadIssuedBooks(selectedStudent.enrollmentNo);
        setBooksToReturn(new Set());
        fetchBorrowerSummary();
      } else {
        toast.error(res.data.message || "Return failed");
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || "Return failed");
    }
  };

  const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString();
  };
  const renderIssuePanel = () => (
    <div className="space-y-6">
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <FiUsers /> Search Student
          </h2>
          <button
            type="button"
            onClick={() => {
              setSelectedStudent(null);
              setStudentQuery("");
              setBooksToAssign([]);
              setIssuedBooks([]);
              setBooksToReturn(new Set());
            }}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear
          </button>
        </div>
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={studentQuery}
            onChange={(e) => {
              setStudentQuery(e.target.value);
              fetchStudents(e.target.value);
            }}
            placeholder="Search by name or enrollment number"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
          {studentResults.length > 0 && (
            <ul className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-lg max-h-60 overflow-auto shadow-lg">
              {studentResults.map((student) => (
                <li
                  key={student._id}
                  onClick={() => handleStudentSelect(student)}
                  className="px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 cursor-pointer"
                >
                  {student.firstName} {student.lastName} ({student.enrollmentNo})
                </li>
              ))}
            </ul>
          )}
        </div>
        {selectedStudent && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-slate-600">
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs uppercase text-slate-500">Name</p>
              <p className="font-medium text-slate-900">
                {selectedStudent.firstName} {selectedStudent.lastName}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs uppercase text-slate-500">Enrollment</p>
              <p className="font-medium text-slate-900">{selectedStudent.enrollmentNo}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs uppercase text-slate-500">Branch</p>
              <p className="font-medium text-slate-900">{selectedStudent.branch}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs uppercase text-slate-500">Semester</p>
              <p className="font-medium text-slate-900">{selectedStudent.semester}</p>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <FiBookOpen /> Pick Books
        </h2>
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={bookQuery}
            onChange={(e) => {
              setBookQuery(e.target.value);
              fetchBooks(e.target.value);
            }}
            placeholder="Search by title, code, or author"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
          {bookResults.length > 0 && (
            <ul className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-lg max-h-64 overflow-auto shadow-lg">
              {bookResults.map((book) => {
                const isSelected = booksToAssign.find((item) => item._id === book._id);
                const available =
                  (book.quantity || 0) - (book.issuedCount || 0);
                return (
                  <li
                    key={book._id}
                    onClick={() => toggleAssignBook(book)}
                    className={`px-4 py-2 text-sm cursor-pointer ${
                      isSelected ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span>{book.bookName}</span>
                      <span className="text-xs text-slate-500">
                        Available {available}/{book.quantity}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {booksToAssign.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {booksToAssign.map((book) => (
              <span
                key={book._id}
                className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm flex items-center gap-2"
              >
                {book.bookName}
                <button
                  type="button"
                  onClick={() => removeAssignedBook(book._id)}
                  className="text-blue-500 hover:text-blue-800 leading-none"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={assignBooks}
            disabled={!selectedStudent || booksToAssign.length === 0}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
          >
            Assign Selected
          </button>
          <button
            type="button"
            onClick={returnSelectedBooks}
            disabled={!selectedStudent || booksToReturn.size === 0}
            className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-700 transition-colors"
          >
            Return Selected
          </button>
          <button
            type="button"
            onClick={() => setShowBookCheck(true)}
            className="px-5 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Who borrowed this book?
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Currently Issued</h2>
          <span className="text-sm text-slate-500">
            {issuedBooks.length} book{issuedBooks.length === 1 ? "" : "s"}
          </span>
        </div>
        {issuedBooks.length === 0 ? (
          <p className="text-sm text-slate-500">No active issues for this student.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 uppercase tracking-wide text-xs">
                  <th className="px-4 py-3">Return</th>
                  <th className="px-4 py-3 text-left">Book</th>
                  <th className="px-4 py-3 text-left">Author</th>
                  <th className="px-4 py-3 text-left">Issue Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {issuedBooks.map((record) => {
                  const id = record.bookId?._id || record.bookId;
                  return (
                    <tr key={`${id}-${record.issueDate}`}>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={booksToReturn.has(id)}
                          onChange={() => toggleReturnSelection(id)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-4 py-3 text-slate-800">
                        {record.bookId?.bookName || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {record.bookId?.author || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(record.issueDate)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderInsightsPanel = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
          <p className="text-sm text-slate-500">Total Titles</p>
          <p className="text-2xl font-semibold text-slate-900">
            {borrowerMeta?.totalTitles ?? 0}
          </p>
        </div>
        <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
          <p className="text-sm text-slate-500">Total Copies</p>
          <p className="text-2xl font-semibold text-slate-900">
            {borrowerMeta?.totalCopies ?? 0}
          </p>
        </div>
        <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
          <p className="text-sm text-slate-500">Currently Issued</p>
          <p className="text-2xl font-semibold text-indigo-600">
            {borrowerMeta?.totalIssued ?? 0}
          </p>
        </div>
        <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
          <p className="text-sm text-slate-500">Available</p>
          <p className="text-2xl font-semibold text-emerald-600">
            {borrowerMeta?.totalAvailable ?? 0}
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <FiUsers /> Active Borrowers
          </h2>
          <button
            type="button"
            onClick={fetchBorrowerSummary}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
          >
            <FiRefreshCw /> Refresh
          </button>
        </div>
        {summaryLoading ? (
          <p className="text-sm text-slate-500">Loading summary...</p>
        ) : borrowerSummary.length === 0 ? (
          <p className="text-sm text-slate-500">No active borrowers at the moment.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 uppercase tracking-wide text-xs">
                  <th className="px-4 py-3 text-left">Student</th>
                  <th className="px-4 py-3 text-left">Enrollment</th>
                  <th className="px-4 py-3 text-left">Branch</th>
                  <th className="px-4 py-3 text-left">Issued</th>
                  <th className="px-4 py-3 text-left">Books</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {borrowerSummary.map((borrower) => (
                  <tr key={borrower.id}>
                    <td className="px-4 py-3 text-slate-800">
                      {borrower.name || "Unknown"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{borrower.enrollmentNo}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {borrower.branch} - Sem {borrower.semester}
                    </td>
                    <td className="px-4 py-3 text-indigo-600 font-semibold">
                      {borrower.currentIssuedCount}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {borrower.issuedBooks
                        .map((book) => book.bookName)
                        .filter(Boolean)
                        .join(", ") || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderBookCheckModal = () => (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-20 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">Who borrowed this book?</h3>
          <button
            type="button"
            onClick={() => {
              setShowBookCheck(false);
              setBookCheckQuery("");
              setBookCheckResults([]);
              setStudentsWithBook([]);
            }}
            className="text-slate-500 hover:text-slate-800"
          >
            Close
          </button>
        </div>
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={bookCheckQuery}
            onChange={(e) => {
              setBookCheckQuery(e.target.value);
              checkBookBorrowers(e.target.value);
            }}
            placeholder="Search by title or author"
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
        {bookCheckResults.length > 0 && (
          <div>
            <p className="text-xs uppercase text-slate-500 mb-2">Matching Books</p>
            <ul className="divide-y divide-slate-100 border border-slate-200 rounded-xl">
              {bookCheckResults.map((book) => (
                <li key={book._id} className="px-4 py-3 text-sm text-slate-700">
                  {book.bookName} - {book.author} (
                  {(book.quantity || 0) - (book.issuedCount || 0)}/{book.quantity} available)
                </li>
              ))}
            </ul>
          </div>
        )}
        {studentsWithBook.length > 0 ? (
          <div>
            <p className="text-xs uppercase text-slate-500 mb-2">Borrowers</p>
            <ul className="divide-y divide-slate-100 border border-slate-200 rounded-xl">
              {studentsWithBook.map((student) => (
                <li key={student._id} className="px-4 py-3 text-sm text-slate-700">
                  <p className="font-medium text-slate-900">
                    {student.firstName} {student.lastName}
                  </p>
                  <p className="text-slate-500 text-xs">{student.enrollmentNo}</p>
                  <p className="text-slate-500 text-xs">{student.branch}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          bookCheckQuery && (
            <p className="text-sm text-slate-500">No active borrowers for this title.</p>
          )
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-5 flex flex-wrap gap-4 justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">Library Issue Desk</h1>
              <p className="text-blue-100 text-sm">
                Assign & return books, verify borrowers, and monitor activity.
              </p>
            </div>
            <div className="flex space-x-2">
              {["issue", "insights"].map((panel) => (
                <button
                  key={panel}
                  className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                    activePanel === panel
                      ? "bg-white text-blue-600"
                      : "text-white hover:bg-white/20"
                  }`}
                  onClick={() => setActivePanel(panel)}
                >
                  {panel === "issue" ? "Issue / Return" : "Borrower Insights"}
                </button>
              ))}
            </div>
          </div>
          <div className="p-6">
            {activePanel === "issue" ? renderIssuePanel() : renderInsightsPanel()}
          </div>
        </div>
      </div>
      {showBookCheck && renderBookCheckModal()}
    </div>
  );
};

export default StudentData;
