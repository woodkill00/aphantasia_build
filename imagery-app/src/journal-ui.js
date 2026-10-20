/* Optional private reflection controls. Session memory only: no scene, clock,
   persistence or submission authority. All user content is rendered as text. */
(function (root) {
  'use strict';
  let nextMount = 0;
  function mount(container, options = {}) {
    const J = root.ImageryJournal;
    if (!J || !container || typeof container.appendChild !== 'function') {
      throw new Error('A journal model and container are required.');
    }
    const document = container.ownerDocument || root.document;
    const onEdit = typeof options.onEdit === 'function' ? options.onEdit : function () {};
    const onTrackingChange = typeof options.onTrackingChange === 'function' ? options.onTrackingChange : function () {};
    const clearTracking = typeof options.clearTracking === 'function' ? options.clearTracking : function () {};
    const getProvenance = typeof options.getProvenance === 'function' ? options.getProvenance : () => ({scene:{status:'unavailable'},exposure:{status:'unavailable'}});
    const getTrackingState = typeof options.getTrackingState === 'function' ? options.getTrackingState : () => ({status:'unavailable'});
    const journal = J.createJournal(), selected = new Set(), listeners = new Set(), urls = new Set(), timers = new Set();
    const prefix = nextMount++ === 0 ? 'journal-' : 'journal-' + nextMount + '-';
    let preview = null, editRevision = 0, previewRevision = -1, destroyed = false;
    const fields = Object.create(null);
    function node(tag, text, className) {
      const element = document.createElement(tag);
      if (text !== undefined) element.textContent = text;
      if (className) element.className = className;
      return element;
    }
    function identify(element, name) { element.id = prefix + name; return element; }
    function listen(element, type, callback) {
      const handler = event => { if (!destroyed) callback(event); };
      element.addEventListener(type, handler);
      listeners.add([element, type, handler]);
    }
    function button(name, text, callback) {
      const element = identify(node('button', text), name);
      element.type = 'button';
      listen(element, 'click', callback);
      return element;
    }
    function paragraph(parent, text) { parent.appendChild(node('p', text, 'hint')); }
    function labelledCheckbox(parent, name, text) {
      const label = node('label', undefined, 'check-label');
      const input = identify(node('input'), name);
      input.type = 'checkbox'; input.checked = false;
      label.htmlFor = input.id;
      label.appendChild(input); label.appendChild(node('span', text));
      parent.appendChild(label);
      return input;
    }
    const shell = node('details', undefined, 'journal-card notes-card');
    shell.appendChild(node('summary', 'Private session journal'));
    const content = node('div', undefined, 'journal-content notes-content');
    shell.appendChild(content); container.appendChild(shell);
    paragraph(content, 'Optional, private reflections for this open page only. The editor works without them. Nothing is recorded until you choose Add reflection.');
    paragraph(content, 'No autosave or transmission. Closing or refreshing this page can lose every unexported reflection. Clear removes this page’s records, not any files you previously downloaded.');
    const enabled = labelledCheckbox(content, 'enable', 'Enable optional session reflections');
    paragraph(content, 'Turning this off discards unfinished answers, but keeps added reflections until you delete or clear them.');
    const questions = identify(node('fieldset', undefined, 'group journal-questions'), 'questions');
    questions.appendChild(node('legend', 'Optional reflection'));
    questions.hidden = true; questions.disabled = true; content.appendChild(questions);
    paragraph(questions, 'These custom exploratory descriptions are not a validated questionnaire, diagnosis or imagery-improvement score. Every answer may be skipped. Do not repeat a display to answer.');
    const tracking = labelledCheckbox(questions, 'track-display', 'Include optional scene fingerprint and visible duration in future reflections');
    paragraph(questions, 'Off by default. This records only the most recent completed main-preview display after opting in (not gallery thumbnails or color swatches): a SHA-256 scene or whole-sequence fingerprint, format and renderer versions, display mode, planned duration, foreground-visible duration and stop reason. Paused frames remain visible and count toward duration. No timestamp, picture, scene content or device identifier is exported. A fingerprint is not anonymity.');
    const trackingStatus = identify(node('p', '', 'hint'), 'tracking-status'); questions.appendChild(trackingStatus);
    function refreshTracking() {
      const state = getTrackingState();
      trackingStatus.textContent = !tracking.checked ? 'Display provenance is off. Reflections will contain unavailable fields.' : state.status === 'ready' ? 'The most recent completed display is ready to attach. Review the exact export before downloading.' : 'Display provenance is ' + state.status + '. Adding now will mark these fields unavailable; no older display is substituted.';
    }
    listen(tracking, 'change', () => { edit(); onTrackingChange(enabled.checked && tracking.checked); refreshTracking(); });
    const labels = {
      'not-asked': 'Not asked', skipped: 'Skipped', none: 'None', uncertain: 'Uncertain',
      present: 'Present', comfortable: 'Comfortable', 'mild-discomfort': 'Mild discomfort',
      'moderate-discomfort': 'Moderate discomfort', 'severe-discomfort': 'Severe discomfort',
      'pre-existing': 'Already present', 'new-or-worse': 'New or worse', no: 'No', yes: 'Yes',
      disliked: 'Disliked', neutral: 'Neutral', liked: 'Liked', difficult: 'Difficult',
      neither: 'Neither difficult nor easy', easy: 'Easy'
    };
    function select(parent, name, labelText, values) {
      const wrapper = node('div', undefined, 'journal-field');
      const label = node('label', labelText);
      const input = identify(node('select'), name);
      label.htmlFor = input.id;
      for (const value of values) {
        const option = node('option', labels[value]); option.value = value;
        input.appendChild(option);
      }
      input.value = 'skipped'; fields[name] = input;
      listen(input, 'change', () => edit());
      wrapper.appendChild(label); wrapper.appendChild(input); parent.appendChild(wrapper);
    }
    const comfort = node('div', undefined, 'journal-grid control-grid');
    questions.appendChild(comfort);
    select(comfort, 'before', 'Comfort before viewing (optional)', J.COMFORT_VALUES);
    select(comfort, 'after', 'Comfort after viewing (optional)', J.COMFORT_VALUES);
    const experiences = [
      ['perception', 'External perception: seeing the displayed design'],
      ['afterimage', 'Afterimage: visual persistence after viewing'],
      ['voluntaryImagery', 'Voluntary imagery: deliberately imagining without the design'],
      ['nonvisualMemory', 'Nonvisual memory: remembering without a visual image']
    ];
    for (const [name, label] of experiences) select(questions, name, label, J.RESPONSE_VALUES);
    paragraph(questions, 'These experiences are separate. Reporting one does not establish another.');
    const symptoms = node('fieldset', undefined, 'group');
    symptoms.appendChild(node('legend', 'Optional discomfort descriptions'));
    questions.appendChild(symptoms);
    for (const [name, label] of [
      ['eyestrain', 'Eyestrain'], ['headache', 'Headache'], ['dizzinessNausea', 'Dizziness or nausea'],
      ['distress', 'Distress'], ['otherDiscomfort', 'Other discomfort']
    ]) select(symptoms, name, label, J.SYMPTOM_VALUES);
    paragraph(symptoms, 'These descriptions do not identify a cause. Hide, End and Escape remain available without answering.');
    select(questions, 'stoppedEarly', 'Stopped earlier than intended', J.STOP_VALUES);
    select(questions, 'preference', 'Preference for this experience', J.PREFERENCE_VALUES);
    select(questions, 'easeOfUse', 'Ease of using the editor', J.EASE_VALUES);
    const noteLabel = node('label', 'Optional note (up to 2,000 characters)');
    const note = identify(node('textarea'), 'note');
    noteLabel.htmlFor = note.id; note.maxLength = J.MAX_NOTE_LENGTH;
    note.autocomplete = 'off'; note.spellcheck = false; note.value = '';
    note.setAttribute('aria-describedby', prefix + 'note-hint');
    fields.note = note;
    questions.appendChild(noteLabel); questions.appendChild(note);
    const noteHint = identify(node('p', 'Only include information you want in this temporary journal. Notes remain plain text.', 'hint'), 'note-hint');
    questions.appendChild(noteHint);
    listen(note, 'input', () => edit());
    const add = button('add', 'Add reflection to session', addReflection);
    questions.appendChild(add);
    const recordsHeading = identify(node('h3', 'Session reflections'), 'records-title');
    content.appendChild(recordsHeading);
    const count = identify(node('p', 'No reflections added. Maximum 20 per session.', 'hint'), 'count');
    content.appendChild(count);
    const entries = identify(node('ol', undefined, 'journal-entries'), 'entries');
    entries.setAttribute('aria-labelledby', recordsHeading.id); content.appendChild(entries);
    const clear = button('clear', 'Clear session journal', clearJournal);
    clear.disabled = true; content.appendChild(clear);
    const exportGroup = node('fieldset', undefined, 'group journal-export');
    exportGroup.appendChild(node('legend', 'Separate journal download'));
    paragraph(exportGroup, 'Select reflections above, then inspect their exact JSON. Only selected entries are included. Scene and sequence downloads do not include this journal. Downloaded files may contain private notes and are not anonymous.');
    const makePreview = button('preview', 'Preview selected journal export', showPreview);
    makePreview.disabled = true; exportGroup.appendChild(makePreview);
    const previewPanel = identify(node('div'), 'preview-panel');
    previewPanel.hidden = true;
    const previewTitle = identify(node('h4', 'Exact selected export'), 'preview-title');
    previewPanel.appendChild(previewTitle);
    const previewText = identify(node('pre', ''), 'preview-text');
    previewText.tabIndex = 0; previewText.setAttribute('aria-labelledby', previewTitle.id);
    previewPanel.appendChild(previewText); exportGroup.appendChild(previewPanel);
    const approval = labelledCheckbox(exportGroup, 'approve', 'I reviewed this exact preview and choose to download only these selected reflections.');
    approval.disabled = true;
    const download = button('download', 'Download approved journal JSON', downloadJournal);
    download.disabled = true; exportGroup.appendChild(download); content.appendChild(exportGroup);
    const status = identify(node('p', 'Journal is optional and off. No reflections have been recorded.', 'hint journal-status'), 'status');
    status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); status.setAttribute('aria-atomic', 'true');
    status.tabIndex = -1;
    content.appendChild(status);
    const research = identify(node('fieldset', undefined, 'group journal-research'), 'research');
    research.disabled = true;
    research.appendChild(node('legend', 'Research submission is not available'));
    paragraph(research, 'Your local journal is not sent anywhere. There is no submission endpoint, upload queue or working Send control. Enabling reflections or approving a local download is not consent to research.');
    paragraph(research, 'Future research would require a responsible operator, applicable ethics and privacy review, instrument rights, a reviewed protocol, retention and withdrawal rules, security review and separate explicit activation.');
    paragraph(research, 'Any future consent would need separate choices for one report, linking reports over time and recontact. Pseudonymous records are not necessarily anonymous; anonymous aggregation may prevent deleting an individual report.');
    content.appendChild(research);

    function say(text) { status.textContent = text; }
    function invalidateExport() {
      editRevision++; preview = null; previewRevision = -1;
      approval.checked = false; approval.disabled = true; download.disabled = true;
      previewPanel.hidden = true; previewText.textContent = '';
    }
    function edit() {
      invalidateExport();
      onEdit();
      refreshControls();
    }
    function resetAnswers() {
      for (const [name, input] of Object.entries(fields)) input.value = name === 'note' ? '' : 'skipped';
    }
    function readReflection() {
      return {
        ...(tracking.checked ? getProvenance() : {scene:{status:'unavailable'},exposure:{status:'unavailable'}}),
        experiences: Object.fromEntries(J.EXPERIENCES.map(name => [name, fields[name].value])),
        comfort: {before: fields.before.value, after: fields.after.value},
        symptoms: Object.fromEntries(J.SYMPTOMS.map(name => [name, fields[name].value])),
        stoppedEarly: fields.stoppedEarly.value, preference: fields.preference.value,
        easeOfUse: fields.easeOfUse.value, note: note.value
      };
    }
    function refreshControls() {
      refreshTracking();
      const length = journal.getState().entries.length;
      add.disabled = !enabled.checked || length >= J.MAX_ENTRIES;
      clear.disabled = !tracking.checked && length === 0 && Object.entries(fields).every(([name, input]) => input.value === (name === 'note' ? '' : 'skipped'));
      makePreview.disabled = selected.size === 0;
      count.textContent = length === 0 ? 'No reflections added. Maximum 20 per session.' :
        length + ' of 20 session reflections. ' + selected.size + ' selected for export.';
    }
    function renderEntries(focusIndex) {
      for (const listener of listeners) {
        const [element, type, handler] = listener;
        if (entries.contains(element)) {
          element.removeEventListener(type, handler); listeners.delete(listener);
        }
      }
      entries.replaceChildren();
      const focusTargets = [];
      for (const entry of journal.getState().entries) {
        const number = entry.id.slice(6), row = node('li', undefined, 'journal-entry');
        const include = labelledCheckbox(row, 'include-' + entry.id, 'Include reflection ' + number + ' in export');
        include.checked = selected.has(entry.id);
        listen(include, 'change', () => {
          edit();
          if (include.checked) selected.add(entry.id); else selected.delete(entry.id);
          refreshControls();
          say(selected.size + ' reflection' + (selected.size === 1 ? '' : 's') + ' selected. Review a new preview before downloading.');
        });
        const detail = node('details'), summary = node('summary', 'Review reflection ' + number);
        detail.appendChild(summary);
        detail.appendChild(node('pre', JSON.stringify(entry.reflection, null, 2)));
        row.appendChild(detail);
        const remove = button('delete-' + entry.id, 'Delete reflection ' + number, () => {
          edit();
          const index = journal.getState().entries.findIndex(item => item.id === entry.id);
          try {
            journal.remove(entry.id); selected.delete(entry.id); renderEntries(index);
            say('Reflection ' + number + ' deleted from this page. Previously downloaded files are unchanged.');
          } catch (error) { say(error.message); }
        });
        row.appendChild(remove); entries.appendChild(row); focusTargets.push(remove);
      }
      refreshControls();
      if (focusIndex !== undefined) (focusTargets[Math.min(focusIndex, focusTargets.length - 1)] || enabled).focus();
    }
    function addReflection() {
      if (!enabled.checked) return;
      edit();
      try {
        journal.add(readReflection()); resetAnswers(); renderEntries();
        say(journal.getState().entries.length >= J.MAX_ENTRIES ?
          'Reflection added. The 20-reflection session limit is reached. Delete entries to add more.' :
          'Reflection added only to this page. Answers reset to skipped; no export selection was added.');
        if (journal.getState().entries.length >= J.MAX_ENTRIES) status.focus();
      } catch (error) { say(error.message); }
    }
    function clearJournal() {
      edit(); clearTracking(); journal.clear(); selected.clear(); resetAnswers(); renderEntries();
      releaseDownloads(); enabled.focus();
      say('Session journal and unfinished answers cleared. Previously downloaded files are unchanged.');
    }
    function showPreview() {
      edit();
      try {
        const ids = journal.getState().entries.filter(entry => selected.has(entry.id)).map(entry => entry.id);
        preview = journal.previewExport(ids); previewRevision = editRevision;
        previewText.textContent = preview.text; previewPanel.hidden = false;
        approval.disabled = false; approval.checked = false; download.disabled = true;
        say('Exact export preview ready. Review it, then separately approve this local download.');
      } catch (error) { say(error.message); }
    }
    function revoke(url) {
      if (!urls.delete(url)) return;
      try { root.URL.revokeObjectURL(url); } catch (_) { /* No reveal or retry authority. */ }
    }
    function releaseDownloads() {
      for (const timer of timers) root.clearTimeout(timer);
      timers.clear(); for (const url of Array.from(urls)) revoke(url);
    }
    function downloadJournal() {
      if (!preview || previewRevision !== editRevision || approval.checked !== true || approval.disabled) {
        invalidateExport(); say('Review a current export preview and explicitly approve it before downloading.'); return;
      }
      let url, anchor;
      try {
        if (typeof root.Blob !== 'function' || !root.URL || typeof root.URL.createObjectURL !== 'function' ||
            typeof root.URL.revokeObjectURL !== 'function') throw new Error('Local file download is unavailable in this browser.');
        const text = journal.confirmExport(preview, true);
        url = root.URL.createObjectURL(new root.Blob([text], {type: 'application/json'}));
        urls.add(url);
        anchor = node('a'); anchor.href = url; anchor.download = 'imagery-field-journal-v' + J.VERSION + '.json'; anchor.hidden = true;
        document.body.appendChild(anchor); anchor.click();
        say('Local download requested. Check your browser downloads. Another download requires a new preview and approval.');
      } catch (_) {
        say('The local download could not be started. Records remain in this page; review a new preview before retrying.');
      } finally {
        if (anchor) anchor.remove();
        invalidateExport();
        if (url) {
          const timer = root.setTimeout(() => { timers.delete(timer); revoke(url); }, 1000);
          timers.add(timer);
        }
      }
    }
    listen(enabled, 'change', () => {
      edit(); questions.hidden = !enabled.checked; questions.disabled = !enabled.checked;
      if (!enabled.checked) { resetAnswers(); tracking.checked = false; onTrackingChange(false); }
      refreshControls();
      say(enabled.checked ? 'Optional reflections enabled. Nothing is recorded until Add reflection.' :
        'Reflections turned off; unfinished answers discarded. Added entries remain available to delete, clear or export.');
    });
    listen(approval, 'change', () => {
      if (approval.disabled || !preview || previewRevision !== editRevision) {
        invalidateExport(); return;
      }
      download.disabled = !approval.checked;
      say(approval.checked ? 'This exact local export is approved. Choose Download to request the file.' :
        'Export approval removed. No file has been requested.');
    });
    refreshControls();
    return Object.freeze({
      getState: journal.getState,
      refreshProvenance() { if (!destroyed) refreshControls(); },
      invalidateExport() {
        if (destroyed) return;
        const hadPreview = preview !== null;
        invalidateExport();
        if (hadPreview) say('The export preview was cleared by a change. Review and approve a new preview before downloading.');
      },
      destroy() {
        if (destroyed) return;
        destroyed = true; onTrackingChange(false); invalidateExport(); resetAnswers(); selected.clear(); journal.clear();
        for (const [element, type, handler] of listeners) element.removeEventListener(type, handler);
        listeners.clear();
        releaseDownloads();
        entries.replaceChildren(); shell.remove();
      }
    });
  }
  root.ImageryJournalUI = Object.freeze({mount});
}(typeof globalThis !== 'undefined' ? globalThis : this));
