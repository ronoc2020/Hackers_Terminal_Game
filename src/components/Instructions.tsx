import React from 'react';

const Instructions: React.FC = () => {
  return (
    <div className="flex-grow bg-gray-900 p-8 overflow-auto">
      <h2 className="text-2xl font-bold mb-4">Welcome to Hacker's Terminal</h2>
      <p className="mb-4">
        Inspired by Mr. Robot and Cicada 3301, this game will test your hacking and puzzle-solving skills.
        Complete missions by using the right commands and tools, and uncover hidden messages along the way.
      </p>
      <h3 className="text-xl font-bold mb-2">How to Play:</h3>
      <ol className="list-decimal list-inside mb-4">
        <li>Type commands in the terminal prompt</li>
        <li>Use "help" to see available commands and tools</li>
        <li>Type "mission" to see your current objectives</li>
        <li>Complete objectives by using simulated commands. Check your mission for what to do next</li>
        <li>Decode hidden messages and explore the file system</li>
        <li>Earn points for completing missions and advance to the next level</li>
      </ol>
      <h3 className="text-xl font-bold mb-2">Basic Commands:</h3>
      <ul className="list-disc list-inside mb-4">
        <li>help: Show available commands and tools</li>
        <li>mission: Display current mission objectives</li>
        <li>ls: List directory contents</li>
        <li>cd: Change directory</li>
        <li>cat: Read file contents</li>
        <li>decode: Decode Base64 encoded messages</li>
        <li>grep: Search for text inside a simulated file</li>
        <li>nmap: Show a fictional lab scan (never scans real hosts)</li>
        <li>clear: Clear the terminal screen</li>
      </ul>
      <p className="mb-4">
        Remember, this is a simulated environment. Always use your skills ethically and legally in the real world.
      </p>
      <p className="text-sm italic">
        Four missions are available. Progress is saved locally if browser storage is enabled; use the Reset button to start again. Press ↑/↓ to recall past commands. The game will start shortly.
      </p>
    </div>
  );
};

export default Instructions;