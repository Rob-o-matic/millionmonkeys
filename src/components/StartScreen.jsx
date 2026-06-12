import React from 'react';
import './StartScreen.css';

export function StartScreen({ onStart }) {
  return (
    <div className="start-screen">
      <div className="start-content">
        <h1>MILLION MONKEYS RESEARCH INITIATIVE</h1>

        <div className="start-text">
          <p>
            The oldest hypothesis in computational philosophy: given a million monkeys,
            a monkey striking keys at random will eventually produce the complete works
            of Shakespeare.
          </p>

          <p>
            Your task: manage a growing colony of typing monkeys. Train them. Upgrade them.
            Automate their output. Push the boundaries of text generation.
          </p>

          <p className="directive">
            Generate new, unknown words of literary greatness. Discover what lies beyond
            the written word.
          </p>
        </div>

        <button className="start-button" onClick={onStart}>
          BEGIN EXPERIMENT
        </button>

        <div className="start-footer">
          <p>Funded by the Institute for Improbable Literature</p>
        </div>
      </div>
    </div>
  );
}
