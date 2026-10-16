  drvVals() {
    const s = this.state, dv = DV[s.drvLang] || DV[LANG] || DV.ru, L = s.live;
    return { dv, dvLang: s.drvLang === 'kz' ? 'kk' : s.drvLang,
      drvSteps: dv.steps.map((t, i) => ({ t, bg: i <= s.drvStep ? 'var(--color-accent)' : 'var(--color-neutral-200)' })),
      drvColdOk: L.V01.cold >= 2 && L.V01.cold <= 8 ? dv.ok : dv.bad,
      drvLangOpts: [['ru', 'RU'], ['kz', 'KZ'], ['de', 'DE'], ['en', 'EN']].map(([k, label]) => ({ label, on: s.drvLang === k, go: () => this.setState({ drvLang: k }), bg: s.drvLang === k ? 'var(--color-accent)' : 'transparent', fg: s.drvLang === k ? 'var(--color-bg)' : 'var(--color-text)' })),
      toggleDrvAdr: () => this.setState({ drvAdr: !s.drvAdr }), drvAdrOpen: s.drvAdr,
      wxUpd: s.wxUpd, closures: CLOSURES,
      wxSrc: [{ name: 'Open-Meteo · Modelle ICON / GFS', st: '19 Städte × 7 Tage' }, { name: 'Kazhydromet · Unwetterwarnungen', st: '2 aktiv' }, { name: 'KazAvtoZhol · Straßenzustand', st: CLOSURES.length + ' Sperrungen' }],
      wxRefresh: () => { this.setState({ wxUpd: this.clockStr(s.t).slice(0, 5) }); this.showToast('Prognose aktualisiert: Open-Meteo, Kazhydromet, KazAvtoZhol (Demo)'); } };
  }
