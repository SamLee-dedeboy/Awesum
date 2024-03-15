<script>
  const base = "/LLMEval";
</script>

<div class="flex flex-col">
  <div class="header" style="flex-basis: 5%;">
    Why are you seeing this page?
  </div>
  <div
    style="font-size: 1.5rem; border-bottom: solid 1px black; width: 100%; text-align:center"
  >
    The browser is blocking you for security reasons. Follow the instructions to
    disable it:
  </div>
  <div style="display: flex; width: 100%; flex: 1;">
    <div
      class="firefox"
      style="width: 100%; text-align: center; margin-right: 5px;"
    >
      <span class="text-2xl font-bold"> Firefox </span>
      <div style="display: flex; flex-direction: column; align-items: left;">
        <div
          style="display: flex; align-items: top; padding: 5px; justify-content: center; border-bottom: dashed 1px black;"
        >
          <img
            src={base + "/security/1.svg"}
            style="width: 30px; height: 30px; margin-top: 5px;"
          />
          <img
            src={base + "/security/firefox_1.png"}
            style="width: 50%; margin-left: 30px;"
          />
        </div>
        <div
          style="display: flex; align-items: top; padding: 5px; justify-content: center; border-bottom: dashed 1px black;"
        >
          <img
            src={base + "/security/2.svg"}
            style="width: 30px; height: 30px; margin-top: 5px;"
          />
          <img
            src={base + "/security/firefox_2.png"}
            style="width: 50%; margin-left: 30px;"
          />
        </div>
        <div
          style="display: flex; align-items: top; padding: 5px; justify-content: center; border-bottom: dashed 1px black;"
        >
          <img
            src={base + "/security/done.svg"}
            style="width: 30px; height: 30px; margin-top: 5px;"
          />
          <img
            src={base + "/security/firefox_done.png"}
            style="width: 50%; margin-left: 30px;"
          />
        </div>
      </div>
    </div>
    <div
      class="chrome"
      style="width: 100%; text-align: center; border-left: 1px dotted black; padding-left: 5px;"
    >
      <span class="text-2xl font-bold"> Chrome </span>
      <div style="display: flex; flex-direction: column; align-items: left; ">
        <div
          style="display: flex; align-items: top; padding: 5px; justify-content: center; border-bottom: dashed 1px black;"
        >
          <img
            src={base + "/security/1.svg"}
            style="width: 30px; height: 30px; margin-top: 5px;"
          />
          <img
            src={base + "/security/chrome_1.png"}
            style="width: 40%; margin-left: 30px;"
          />
        </div>
        <div
          style="display: flex; align-items: top; padding: 5px; justify-content: center; border-bottom: dashed 1px black;"
        >
          <img
            src={base + "/security/2.svg"}
            style="width: 30px; height: 30px; margin-top: 5px;"
          />
          <img
            src={base + "/security/chrome_2.png"}
            style="height: 50px; margin-left: 30px;"
          />
        </div>
        <div
          style="display: flex; align-items: top; padding: 5px; justify-content: center; border-bottom: dashed 1px black;"
        >
          <img
            src={base + "/security/done.svg"}
            style="width: 30px; height: 30px; margin-top: 5px;"
          />
          <img
            src={base + "/security/chrome_done.png"}
            style="width: 50%; margin-left: 30px;"
          />
        </div>
      </div>
    </div>
  </div>
</div>
