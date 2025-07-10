import React, { useState, useEffect } from "react";

const { ipcRenderer } = window.require("electron");

export default function App() {
  const [filter, setFilter] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [editingIdx, setEditingIdx] = useState(null);
  const [editName, setEditName] = useState("");
  const [saveStatus, setSaveStatus] = useState(null);

  // Load accounts from main process via IPC (userData file)
  useEffect(() => {
    ipcRenderer.invoke('get-accounts-data').then((data) => {
      setAccounts(data || []);
    }).catch((err) => {
      console.error("Failed to load accounts from main process:", err);
      setAccounts([]);
    });
  }, []);

  useEffect(() => {
    const listener = (event, response) => {
      if (response.success) {
        setSaveStatus("Saved successfully!");
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        setSaveStatus("Save failed: " + response.error);
        setTimeout(() => setSaveStatus(null), 5000);
      }
    };

    ipcRenderer.on("save-accounts-response", listener);

    return () => {
      ipcRenderer.removeListener("save-accounts-response", listener);
    };
  }, []);

  const filteredAccounts = accounts.filter((acc) =>
    acc.name.toLowerCase().includes(filter.toLowerCase())
  );

  const openAccount = (partition, name, idx) => {
    setSelectedIdx(idx);
    ipcRenderer.send("open-account-window", partition, name);
  };

  const startEditing = (idx, currentName) => {
    setEditingIdx(idx);
    setEditName(currentName);
  };

  const saveEdit = (idx) => {
    const updatedAccounts = [...accounts];
    updatedAccounts[idx].name = editName.trim() || updatedAccounts[idx].name;
    setAccounts(updatedAccounts);
    setEditingIdx(null);
    setEditName("");

    ipcRenderer.send("save-accounts", updatedAccounts);
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        backgroundColor: "#121212",
        color: "#fff",
        fontFamily:
          "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          padding: 20,
          boxSizing: "border-box",
          backgroundColor: "#1a1a1a",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h1
          style={{
            color: "#25D366",
            marginBottom: 20,
            userSelect: "none",
          }}
        >
          WhatsApp Accounts
        </h1>

        <input
          type="text"
          placeholder="Search accounts..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            width: "100%",
            padding: "12px 15px",
            borderRadius: 8,
            border: "none",
            marginBottom: 20,
            fontSize: 16,
            outline: "none",
            backgroundColor: "#222",
            color: "#eee",
            boxSizing: "border-box",
          }}
        />

        {/* Buttons container */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "20px 15px",
            overflowY: "auto",
            maxHeight: "calc(100vh - 150px)",
          }}
        >
          {filteredAccounts.length === 0 && (
            <p
              style={{
                color: "#999",
                textAlign: "center",
                fontSize: 14,
                width: "100%",
              }}
            >
              No accounts found.
            </p>
          )}

          {filteredAccounts.map((acc, idx) => {
            const actualIdx = accounts.findIndex(
              (a) => a.partition === acc.partition
            );

            if (editingIdx === actualIdx) {
              return (
                <div
                  key={acc.partition}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    width: 150,
                  }}
                >
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{
                      padding: 14,
                      fontSize: 16,
                      borderRadius: 8,
                      border: "none",
                      outline: "none",
                      marginBottom: 8,
                      boxSizing: "border-box",
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit(actualIdx);
                      else if (e.key === "Escape") setEditingIdx(null);
                    }}
                    autoFocus
                  />
                  <button
                    onClick={() => saveEdit(actualIdx)}
                    style={{
                      padding: "14px 20px",
                      borderRadius: 8,
                      border: "none",
                      backgroundColor: "#1ebc57",
                      color: "#222",
                      cursor: "pointer",
                      fontSize: 16,
                      boxShadow: "0 0 10px #1ebc57cc",
                    }}
                    type="button"
                  >
                    Save
                  </button>
                </div>
              );
            }

            return (
              <div
                key={acc.partition}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  width: 150,
                  alignItems: "center",
                }}
              >
                <button
                  onClick={() => openAccount(acc.partition, acc.name, actualIdx)}
                  style={{
                    width: "100%",
                    padding: 14,
                    fontSize: 16,
                    borderRadius: 8,
                    border: "none",
                    cursor: "pointer",
                    backgroundColor:
                      selectedIdx === actualIdx ? "#1ebc57" : "#25D366",
                    color: "#222",
                    boxShadow:
                      selectedIdx === actualIdx
                        ? "0 0 10px #1ebc57cc"
                        : "0 2px 8px #25d36644",
                    transition: "background-color 0.2s",
                    whiteSpace: "normal",
                    wordWrap: "break-word",
                    textAlign: "center",
                    marginBottom: 6,
                  }}
                  onMouseEnter={(e) => {
                    if (selectedIdx !== actualIdx)
                      e.currentTarget.style.backgroundColor = "#1ebe57";
                  }}
                  onMouseLeave={(e) => {
                    if (selectedIdx !== actualIdx)
                      e.currentTarget.style.backgroundColor = "#25D366";
                  }}
                  type="button"
                >
                  {acc.name}
                </button>
                <button
                  onClick={() => startEditing(actualIdx, acc.name)}
                  style={{
                    width: "100%",
                    padding: "10px 20px",
                    borderRadius: 8,
                    border: "none",
                    backgroundColor: "#333",
                    color: "#eee",
                    cursor: "pointer",
                    fontSize: 14,
                    userSelect: "none",
                  }}
                  title="Edit Name"
                  type="button"
                >
                  Edit
                </button>
              </div>
            );
          })}
        </div>

        {saveStatus && (
          <div
            style={{
              marginTop: 10,
              color: "#25D366",
              fontSize: 14,
              userSelect: "none",
            }}
          >
            {saveStatus}
          </div>
        )}
      </div>

      <main
        style={{
          flexGrow: 1,
          backgroundColor: "#121212",
          color: "#eee",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: 20,
          userSelect: "none",
        }}
      >
        {selectedIdx !== null && (
          <p>Opened: {accounts[selectedIdx]?.name || "Unknown"}</p>
        )}
      </main>
    </div>
  );
}
