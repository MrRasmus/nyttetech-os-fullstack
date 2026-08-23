"use client";

import { useMemo, useState } from "react";

type Fault = "none" | "sensor" | "estop" | "contactor";

export default function PlcLab() {
  const [start, setStart] = useState(false);
  const [guard, setGuard] = useState(true);
  const [sensor, setSensor] = useState(false);
  const [fault, setFault] = useState<Fault>("none");
  const [latched, setLatched] = useState(false);
  const [message, setMessage] = useState("System klar. Start motoren og prøv derefter at injicere en fejl.");

  const logic = useMemo(() => {
    const safe = guard && fault !== "estop";
    const startSignal = start || latched;
    const sensorSeen = fault === "sensor" ? false : sensor;
    const command = safe && startSignal;
    const motor = command && fault !== "contactor";
    return { safe, startSignal, sensorSeen, command, motor };
  }, [guard, start, latched, sensor, fault]);

  function toggleStart() {
    const next = !start;
    setStart(next);
    if (next && logic.safe) setLatched(true);
    if (!next) setLatched(false);
  }

  function injectFault() {
    const faults: Fault[] = ["sensor", "estop", "contactor"];
    const next = faults[Math.floor(Math.random() * faults.length)];
    setFault(next);
    setMessage("Fejl injiceret. Brug signalerne i ladder-visningen til at finde den.");
  }

  function diagnose(choice: Fault) {
    if (choice === fault) {
      setMessage(`Korrekt: ${choice}. Fejlen er nulstillet.`);
      setFault("none");
    } else {
      setMessage(`Ikke helt. ${choice} passer ikke med de viste signaler.`);
    }
  }

  const inputs = [
    ["I0.0", "START", start, toggleStart],
    ["I0.1", "GUARD CLOSED", guard, () => setGuard(v => !v)],
    ["I0.2", "PART SENSOR", sensor, () => setSensor(v => !v)],
  ] as const;

  return (
    <div className="app-pad">
      <h2 className="app-title">PLC / I/O fejlfinding</h2>
      <p className="app-sub">En lille scan-cyklus med latch, sikkerhedskæde, sensor og kontaktorfejl.</p>
      <div className="plc-layout">
        <div className="io-panel">
          {inputs.map(([addr, label, value, action]) => (
            <div className="io-row" key={addr}>
              <div><b>{addr}</b><br/><small>{label}</small></div>
              <button type="button" className={`toggle ${value ? "on" : ""}`} onClick={action} aria-pressed={value}><i /></button>
            </div>
          ))}
          <div className="io-row"><div><b>Q0.0</b><br/><small>MOTOR</small></div><span style={{ color: logic.motor ? "var(--green)" : "#627386" }}>●</span></div>
          <div className="io-row"><div><b>M0.0</b><br/><small>RUN LATCH</small></div><span style={{ color: latched ? "var(--cyan)" : "#627386" }}>●</span></div>
        </div>
        <div className="ladder">
          <div className="ladder-rung">
            <span className={`contact ${logic.safe ? "hot" : ""}`}>I0.1 SAFE</span>
            <span className={`contact ${logic.startSignal ? "hot" : ""}`}>I0.0/M0.0</span>
            <span className={`coil ${logic.command ? "hot" : ""}`}>M0.0 RUN</span>
          </div>
          <div className="ladder-rung">
            <span className={`contact ${logic.safe ? "hot" : ""}`}>M0.0 RUN</span>
            <span className={`coil ${logic.motor ? "hot" : ""}`}>Q0.0 MOTOR</span>
          </div>
          <div className="ladder-rung">
            <span className={`contact ${logic.sensorSeen ? "hot" : ""}`}>I0.2 SENSOR</span>
            <span className={`coil ${logic.sensorSeen ? "hot" : ""}`}>DB1.PART</span>
          </div>
          <div className="fault-box">{message}</div>
          <div className="plc-actions">
            <button className="btn danger" type="button" onClick={injectFault} disabled={fault !== "none"}>Injicér tilfældig fejl</button>
            <button className="btn" type="button" onClick={() => diagnose("sensor")}>Sensorfejl</button>
            <button className="btn" type="button" onClick={() => diagnose("estop")}>Sikkerhedskæde</button>
            <button className="btn" type="button" onClick={() => diagnose("contactor")}>Kontaktor</button>
          </div>
        </div>
      </div>
    </div>
  );
}
