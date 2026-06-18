const students = [
  { id: 1, name: "Rahul", marks: 85, city: "Delhi" },
  { id: 2, name: "Aman", marks: 45, city: "Mumbai" },
  { id: 3, name: "Priya", marks: 92, city: "Pune" },
  { id: 4, name: "Neha", marks: 76, city: "Delhi" },
  { id: 5, name: "Rohit", marks: 39, city: "Jaipur" }
];

// 1. Array containing only student names
const names = students.map(student => student.name);
console.log("Names:", names);

// 2. Students who scored more than 50 marks
const above50 = students.filter(student => student.marks > 50);
console.log("Marks > 50:", above50);

// 3. Student whose id is 3
const studentId3 = students.find(student => student.id === 3);
console.log("Student with ID 3:", studentId3);

// 4. Total marks of all students
const totalMarks = students.reduce((sum, student) => sum + student.marks, 0);
console.log("Total Marks:", totalMarks);

// 5. Average marks
const averageMarks = totalMarks / students.length;
console.log("Average Marks:", averageMarks);

// 6. Check if at least one student failed
const hasFailed = students.some(student => student.marks < 50);
console.log("At least one failed:", hasFailed);

// 7. Check if all students passed
const allPassed = students.every(student => student.marks >= 50);
console.log("All Passed:", allPassed);

// 8. Sort by marks (Ascending)
const ascending = [...students].sort((a, b) => a.marks - b.marks);
console.log("Ascending Order:", ascending);

// 9. Sort by marks (Descending)
const descending = [...students].sort((a, b) => b.marks - a.marks);
console.log("Descending Order:", descending);

// 10. Array containing only city names
const cities = students.map(student => student.city);
console.log("Cities:", cities);


// BONUS QUESTIONS

// 1. Topper student
const topper = students.reduce((top, student) =>
  student.marks > top.marks ? student : top
);
console.log("Topper:", topper);

// 2. Count students from Delhi
const delhiCount = students.filter(student => student.city === "Delhi").length;
console.log("Delhi Students Count:", delhiCount);

// 3. Object with city names as keys and student counts as values
const cityCounts = students.reduce((acc, student) => {
  acc[student.city] = (acc[student.city] || 0) + 1;
  return acc;
}, {});
console.log("City Counts:", cityCounts);