<svelte:options tag="hcc-captcha" />

<script>
  export let server = 'captcha.qdzx.icu';
  export const refresh = async () => await refreshCaptcha();
  export const reset = async () => {
    isSuccess = false;
    code = undefined;
  };
  export const getCode = () => code;
  export let onError = () => {};
  export let onSuccess = _code => {};

  import { fetch as fetchPolyfill } from 'whatwg-fetch';
  import PlaceHolderImg from './icons/loading-placeholder.png';

  const serviceUrl = `https://${server}`;
  let imgUrl = PlaceHolderImg;
  let requestId = undefined;
  let isLoading = false;
  let isDragging = false;
  let isSuccess = false;
  let isError = false;
  let showCaptchaBox = false;
  let boxOpacity = 0;
  let isBannerClosing = false;
  let button;
  let shake = false;
  let startX = 0;
  let offset = 0;
  let y = 0;
  let degree = 0;
  let samples = [];
  let sampleInterval;
  let timeElapsed = 0;
  const interval = 30;
  let code = undefined;
  const onMouseDown = () => {
    if (isSuccess) return;
    isDragging = true;
    startX = button.getBoundingClientRect().x;
    y = button.getBoundingClientRect().y;
    startSampling();
  };
  const onMouseMove = event => {
    event.preventDefault();
    if (!isDragging) {
      stopSampling();
      return;
    }
    y = event.clientY;
    var offsetValue = event.clientX - startX - 30;
    if (offsetValue > 280) offset = 280;
    else if (offsetValue < 0) offset = 0;
    else offset = offsetValue;
    degree = (offset * 12) / 7;
  };
  const onTouchStart = event => {
    if (isSuccess) return;
    isDragging = true;
    let touch;
    if (event.touches) {
      touch = event.touches[0];
    } else {
      touch = event;
    }
    startX = touch.clientX;
    y = touch.clientY;
    startSampling();
  };
  const onTouchMove = event => {
    event.preventDefault();
    if (!isDragging) {
      stopSampling();
      return;
    }
    let touch;
    if (event.touches) {
      touch = event.touches[0];
    } else {
      touch = event;
    }
    y = touch.clientY;
    var offsetValue = touch.clientX - startX;
    if (offsetValue > 210) offset = 210;
    else if (offsetValue < 0) offset = 0;
    else offset = offsetValue;
    degree = (offset * 12) / 7;
  };
  const finishDrag = () => {
    stopSampling();
    if (!isDragging) return;
    isDragging = false;
    validate();
  };
  const startSampling = () => {
    sampling();
    sampleInterval = setInterval(sampling, interval);
  };
  const stopSampling = () => {
    clearInterval(sampleInterval);
    timeElapsed = 0;
  };
  const sampling = () => {
    timeElapsed += interval;
    samples.push([offset, y, timeElapsed]);
  };
  const blobToBase64 = blob => {
    return new Promise(resolve => {
      let reader = new FileReader();
      reader.onload = e => {
        resolve(e.target.result);
      };
      reader.readAsDataURL(blob);
    });
  };
  const loadCaptcha = async () => {
    isLoading = true;
    imgUrl = PlaceHolderImg;
    degree = 0;
    const datares = await fetchPolyfill(serviceUrl + '/get');
    const data = await datares.json();
    requestId = data.request_id;
    const imageres = await fetchPolyfill(`${serviceUrl}/image/${requestId}`);

    const image = await imageres.blob();
    const imageUri = await blobToBase64(image);
    imgUrl = imageUri;
    offset = 0;
    isLoading = false;
    showCaptchaBox = true;
    setTimeout(() => {
      boxOpacity = 1;
    }, 50);
    setTimeout(() => {
      shake = false;
    }, 600);
  };
  const closeCaptcha = () => {
    isBannerClosing = true;
    setTimeout(() => {
      boxOpacity = 0;
      setTimeout(() => {
        showCaptchaBox = false;
      }, 550);
      isBannerClosing = false;
    }, 600);
  };
  const refreshCaptcha = async () => {
    isBannerClosing = true;
    await loadCaptcha();
    isBannerClosing = false;
  };
  const validate = async () => {
    samples = samples.map(e => [Math.round(e[0]), Math.round(e[1]), e[2]]);
    const form = new FormData();
    form.append('request_id', requestId);
    form.append('answer', degree);
    form.append('sample', window.btoa(JSON.stringify(samples)));
    const res = await fetch(serviceUrl + '/verificate', {
      method: 'POST',
      body: form,
    });
    const data = await res.json();
    if (data.status === 'success') {
      isSuccess = true;
      onSuccess(requestId);
      closeCaptcha();
    } else {
      shake = true;
      isError = true;
      setTimeout(() => {
        isError = false;
        refreshCaptcha();
      }, 2000);
      onError();
    }
  };
</script>

<main>
  <div class="captcha-container">
    <div
      class="captcha-button {isLoading ? 'loading' : ''} {showCaptchaBox
        ? 'solving'
        : ''} {isSuccess ? 'success' : ''}"
      on:click={() => {
        if (isSuccess || showCaptchaBox) return;
        loadCaptcha();
      }}
    >
      <div class="left-border" />
      <span>
        {isSuccess
          ? '验证通过'
          : showCaptchaBox
          ? '验证中'
          : !isLoading
          ? '点击完成验证'
          : '验证码加载中'}
      </span>

      <svg
        class="logo"
        width="20"
        height="21"
        viewBox="0 0 20 21"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M10 0.698288L10.6402 1.23177C13.3622 3.50012 15.5703 3.50004 16.9806 3.5L18 3.5V12.099L17.9806 12.1961C17.4238 14.9799 15.7219 17.1578 14.1081 18.6168C13.296 19.3511 12.4846 19.9233 11.8079 20.3173C11.4703 20.5139 11.1547 20.6728 10.8797 20.786C10.6472 20.8817 10.3169 21 10 21C9.3953 21 8.66296 20.6999 7.99512 20.3253C7.27896 19.9235 6.4739 19.3426 5.68899 18.6026C4.12359 17.1266 2.57052 14.9516 2.01942 12.1961L2 12.099V3.5L3.01938 3.5C4.42972 3.50004 6.6378 3.50012 9.35982 1.23177L10 0.698288ZM4 5.48186V11.8983C4.46549 14.0996 5.72874 15.8913 7.06101 17.1474C7.73443 17.7823 8.40854 18.264 8.97363 18.581C9.25638 18.7396 9.50038 18.8506 9.69361 18.9195C9.78974 18.9538 9.86624 18.9752 9.92323 18.9875C9.9377 18.9906 9.95003 18.993 9.96032 18.9947C9.98865 18.986 10.04 18.9689 10.1183 18.9366C10.2893 18.8662 10.5219 18.7517 10.8015 18.5889C11.3592 18.2642 12.0582 17.7739 12.7669 17.1332C14.1746 15.8605 15.537 14.0716 16 11.8979V5.48186C14.4961 5.40981 12.3963 5.05172 10 3.27246C7.60369 5.05172 5.50388 5.40981 4 5.48186Z"
        />
        <path
          d="M7.5 7C7.87503 7 8.25005 7 8.64252 7C8.64252 7.5498 8.64252 8.09278 8.64252 8.65308C9.93368 8.65308 11.2074 8.65308 12.5 8.65308C12.5 9.02289 12.5 9.37553 12.5 9.72818C11.2147 9.7336 9.95312 9.73133 8.65597 9.73168C8.65597 11.154 8.65597 12.5665 8.65597 14C8.25987 14 7.87993 14 7.5 14C7.5 11.6667 7.5 9.33333 7.5 7ZM11.3947 13.314C11.7828 13.314 12.1406 13.314 12.5 13.314C12.5 12.1097 12.5 10.9188 12.5 9.72818L11.9474 9.72993L11.3947 9.73168C11.3947 10.9269 11.3947 12.1221 11.3947 13.314Z"
        />
      </svg>
    </div>
    <div
      class="captcha-box"
      style="display: {showCaptchaBox
        ? 'block'
        : 'none'}; opacity: {boxOpacity}"
      on:mouseleave={finishDrag}
    >
      <div
        class="banner {isBannerClosing
          ? 'close'
          : boxOpacity === 1
          ? 'open'
          : ''} {isSuccess ? 'success' : ''} {isError ? 'error' : ''}"
      />
      <div class="tip">请拖拽滑块使图片正立</div>
      <div class="widget">
        <img
          class="spinner"
          style="transform: rotate({!isLoading ? degree : 0}deg)"
          src={imgUrl}
          alt="Captcha"
          draggable="false"
        />
      </div>
      <div class="slider">
        <div class="track" />
        <div
          class="button {shake ? 'shake' : ''}"
          bind:this={button}
          style="left: {offset}px"
          on:mousedown={onMouseDown}
          on:touchstart={onTouchStart}
          on:mousemove={onMouseMove}
          on:touchmove={onTouchMove}
          on:mouseup={finishDrag}
          on:touchend={finishDrag}
        >
          <svg
            width="19"
            height="16"
            viewBox="0 0 19 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11.684 0.649902L9.85051 2.67479L13.64 6.90015H0.449951V9.63558H13.6077L9.85047 13.8248L11.684 15.8499L18.5 8.24989L11.684 0.649902Z"
              fill="white"
            />
          </svg>
        </div>
      </div>
      <div class="toolbar">
        <div class="toolbar-left">
          <div on:click={closeCaptcha}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12ZM12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22ZM7.75732 9.17155L9.17153 7.75732L11.9999 10.5858L14.8284 7.75732L16.2426 9.17155L13.4141 12L16.2425 14.8284L14.8283 16.2427L11.9999 13.4142L9.17154 16.2427L7.75733 14.8284L10.5857 12L7.75732 9.17155Z"
              />
            </svg>
          </div>
          <div on:click={refreshCaptcha}>
            <svg
              width="24"
              height="20"
              viewBox="0 0 24 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M6 12H4.25203C5.14012 15.4505 8.27232 18 12 18C14.5186 18 16.7663 16.8376 18.2352 15.0129L20.2602 15.6381C20.1126 15.854 19.9567 16.0638 19.7931 16.267C19.0519 17.1875 18.151 17.9739 17.1325 18.5842C15.6321 19.4832 13.8764 20 12 20C7.97624 20 4.50755 17.6235 2.92096 14.1975C2.59993 13.5043 2.35596 12.7681 2.20004 12H0L3 8L6 12ZM3.73706 4.36586L5.76202 4.99056C7.23089 3.16388 9.47974 2 12 2C15.7277 2 18.8599 4.54955 19.7479 8H18L21 12L24 8H21.7999C21.6439 7.2315 21.3998 6.49501 21.0786 5.80153C19.4918 2.37607 16.0234 0 12 0C10.1222 0 8.36536 0.517547 6.86423 1.41778C5.84546 2.02874 4.94448 2.81597 4.20346 3.7373C4.04007 3.94045 3.88445 4.15012 3.73706 4.36586Z"
              />
            </svg>
          </div>
        </div>
        <div class="toolbar-right">
          <svg
            width="91"
            height="21"
            viewBox="0 0 91 21"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M8 0L8.64018 0.533487C11.3622 2.80183 13.5703 2.80176 14.9806 2.80171L16 2.80171V11.4007L15.9806 11.4978C15.4238 14.2817 13.7219 16.4595 12.1081 17.9185C11.296 18.6528 10.4846 19.225 9.80788 19.619C9.47026 19.8156 9.15467 19.9745 8.87971 20.0877C8.64723 20.1834 8.31691 20.3017 8 20.3017C7.3953 20.3017 6.66296 20.0016 5.99512 19.627C5.27896 19.2252 4.4739 18.6444 3.68899 17.9043C2.12359 16.4283 0.570516 14.2533 0.0194193 11.4978L0 11.4007V2.80171L1.01938 2.80171C2.42972 2.80176 4.6378 2.80183 7.35982 0.533487L8 0ZM2 4.78357V11.2C2.46549 13.4013 3.72874 15.193 5.06101 16.4491C5.73443 17.0841 6.40854 17.5657 6.97363 17.8827C7.25638 18.0413 7.50038 18.1523 7.69361 18.2212C7.78974 18.2556 7.86624 18.2769 7.92323 18.2892C7.9377 18.2923 7.95003 18.2947 7.96032 18.2964C7.98865 18.2877 8.04004 18.2706 8.11834 18.2383C8.28934 18.1679 8.52192 18.0534 8.8015 17.8907C9.35918 17.5659 10.0582 17.0756 10.7669 16.4349C12.1746 15.1622 13.537 13.3733 14 11.1996V4.78357C12.4961 4.71152 10.3963 4.35343 8 2.57417C5.60369 4.35343 3.50388 4.71152 2 4.78357Z"
            />
            <path
              d="M5.5 6.30171C5.87503 6.30171 6.25005 6.30171 6.64252 6.30171C6.64252 6.85151 6.64252 7.39449 6.64252 7.9548C7.93368 7.9548 9.20739 7.9548 10.5 7.9548C10.5 8.3246 10.5 8.67724 10.5 9.02989C9.21466 9.03532 7.95312 9.03304 6.65597 9.03339C6.65597 10.4557 6.65597 11.8682 6.65597 13.3017C6.25987 13.3017 5.87993 13.3017 5.5 13.3017C5.5 10.9684 5.5 8.63505 5.5 6.30171ZM9.39472 12.6157C9.78283 12.6157 10.1406 12.6157 10.5 12.6157C10.5 11.4114 10.5 10.2205 10.5 9.02989L9.39472 9.03339C9.39472 10.2286 9.39472 11.4238 9.39472 12.6157Z"
            />
            <path
              d="M22.1253 5.46978V15.1336H20.5V5.46978H22.1253ZM25.87 9.29331V10.6659H22.0213V9.29331H25.87ZM27.3523 5.46978V15.1336H25.727V5.46978H27.3523Z"
            />
            <path
              d="M32.7179 5.30171C33.1253 5.30171 33.472 5.31572 33.7581 5.34373C34.0441 5.3624 34.3085 5.39508 34.5512 5.44177C34.7939 5.47912 35.0453 5.53514 35.3053 5.60984L35.1623 6.91236C34.8936 6.89368 34.6422 6.87968 34.4082 6.87034C34.1741 6.85167 33.9227 6.83766 33.654 6.82832C33.394 6.81898 33.0819 6.81432 32.7179 6.81432C32.2151 6.81432 31.8207 6.92169 31.5346 7.13645C31.2486 7.3512 31.0449 7.71068 30.9235 8.21488C30.8108 8.71908 30.7545 9.41469 30.7545 10.3017C30.7545 11.1887 30.8108 11.8843 30.9235 12.3885C31.0449 12.8927 31.2486 13.2522 31.5346 13.467C31.8207 13.6817 32.2151 13.7891 32.7179 13.7891C33.2986 13.7891 33.7841 13.7798 34.1741 13.7611C34.5729 13.7331 34.9629 13.6957 35.3443 13.6491L35.4874 14.9376C35.0973 15.0683 34.6942 15.1617 34.2781 15.2177C33.8621 15.2737 33.342 15.3017 32.7179 15.3017C31.8164 15.3017 31.0969 15.143 30.5595 14.8255C30.022 14.4987 29.632 13.9712 29.3893 13.2429C29.1552 12.5146 29.0382 11.5342 29.0382 10.3017C29.0382 9.06922 29.1552 8.08883 29.3893 7.36054C29.632 6.63224 30.022 6.10937 30.5595 5.79191C31.0969 5.46511 31.8164 5.30171 32.7179 5.30171Z"
            />
            <path
              d="M40.1333 5.30171C40.5407 5.30171 40.8874 5.31572 41.1735 5.34373C41.4595 5.3624 41.7239 5.39508 41.9666 5.44177C42.2093 5.47912 42.4607 5.53514 42.7207 5.60984L42.5777 6.91236C42.309 6.89368 42.0576 6.87968 41.8236 6.87034C41.5895 6.85167 41.3382 6.83766 41.0695 6.82832C40.8094 6.81898 40.4973 6.81432 40.1333 6.81432C39.6305 6.81432 39.2361 6.92169 38.9501 7.13645C38.664 7.3512 38.4603 7.71068 38.339 8.21488C38.2263 8.71908 38.1699 9.41469 38.1699 10.3017C38.1699 11.1887 38.2263 11.8843 38.339 12.3885C38.4603 12.8927 38.664 13.2522 38.9501 13.467C39.2361 13.6817 39.6305 13.7891 40.1333 13.7891C40.7141 13.7891 41.1995 13.7798 41.5895 13.7611C41.9883 13.7331 42.3784 13.6957 42.7598 13.6491L42.9028 14.9376C42.5127 15.0683 42.1096 15.1617 41.6936 15.2177C41.2775 15.2737 40.7574 15.3017 40.1333 15.3017C39.2318 15.3017 38.5123 15.143 37.9749 14.8255C37.4375 14.4987 37.0474 13.9712 36.8047 13.2429C36.5706 12.5146 36.4536 11.5342 36.4536 10.3017C36.4536 9.06922 36.5706 8.08883 36.8047 7.36054C37.0474 6.63224 37.4375 6.10937 37.9749 5.79191C38.5123 5.46511 39.2318 5.30171 40.1333 5.30171Z"
            />
            <path
              d="M47.9487 5.46978C48.0527 5.46978 48.1438 5.50246 48.2218 5.56782C48.2998 5.62384 48.3518 5.70321 48.3778 5.80591L51.2643 15.1336H50.0811L47.7537 7.20647C47.719 7.07575 47.68 6.94504 47.6367 6.81432C47.602 6.67426 47.5673 6.54354 47.5326 6.42216H47.1686C47.1339 6.54354 47.0992 6.67426 47.0646 6.81432C47.0299 6.94504 46.9909 7.07575 46.9475 7.20647L44.6201 15.1336H43.4369L46.3234 5.80591C46.3494 5.70321 46.4014 5.62384 46.4795 5.56782C46.5575 5.50246 46.6485 5.46978 46.7525 5.46978H47.9487ZM49.613 11.044V12.1084H45.0622V11.044H49.613Z"
            />
            <path
              d="M55.608 5.34373C56.3275 5.34373 56.8953 5.43243 57.3113 5.60984C57.7361 5.78724 58.0395 6.09536 58.2215 6.5342C58.4035 6.96371 58.4946 7.57529 58.4946 8.36894C58.4946 9.16259 58.4035 9.77884 58.2215 10.2177C58.0481 10.6565 57.7578 10.9646 57.3503 11.142C56.9516 11.3101 56.4142 11.3941 55.7381 11.3941C55.374 11.3941 55.0229 11.3848 54.6849 11.3661C54.3555 11.3475 54.0521 11.3241 53.7747 11.2961C53.4973 11.2588 53.2589 11.2214 53.0596 11.1841C52.8689 11.1467 52.7345 11.114 52.6565 11.086L52.6955 10.3297C53.1549 10.3297 53.6317 10.3297 54.1258 10.3297C54.6199 10.3297 55.1096 10.3297 55.595 10.3297C56.0284 10.3204 56.3708 10.2644 56.6222 10.1617C56.8823 10.0496 57.0643 9.85353 57.1683 9.57342C57.281 9.28397 57.3373 8.88248 57.3373 8.36894C57.3373 7.84606 57.281 7.44457 57.1683 7.16446C57.0643 6.88435 56.8823 6.68827 56.6222 6.57622C56.3708 6.46418 56.0284 6.40815 55.595 6.40815C54.8842 6.40815 54.2688 6.41282 53.7487 6.42216C53.2373 6.4315 52.8905 6.4455 52.7085 6.46418L52.5265 5.46978C52.8559 5.43243 53.1636 5.40442 53.4496 5.38575C53.7357 5.36707 54.0477 5.35773 54.3858 5.35773C54.7239 5.3484 55.1313 5.34373 55.608 5.34373ZM53.6707 5.46978V15.1336H52.5265V5.46978H53.6707Z"
            />
            <path
              d="M63.4074 5.46978V15.1336H62.2632V5.46978H63.4074ZM66.307 5.46978V6.56222H59.3767V5.46978H66.307Z"
            />
            <path
              d="M70.7587 5.30171C71.1401 5.30171 71.4652 5.31105 71.7339 5.32972C72.0113 5.3484 72.2627 5.38108 72.4881 5.42776C72.7221 5.46511 72.9605 5.51646 73.2032 5.58182L73.0862 6.5202C72.8261 6.49219 72.5834 6.46885 72.358 6.45017C72.1413 6.4315 71.9073 6.41749 71.6559 6.40815C71.4045 6.39882 71.1055 6.39415 70.7587 6.39415C70.178 6.39415 69.7186 6.51553 69.3805 6.75829C69.0424 7.00106 68.7997 7.40722 68.6524 7.97678C68.5137 8.54634 68.4443 9.32132 68.4443 10.3017C68.4443 11.2821 68.5137 12.0571 68.6524 12.6266C68.7997 13.1962 69.0424 13.6024 69.3805 13.8451C69.7186 14.0879 70.178 14.2093 70.7587 14.2093C71.3135 14.2093 71.7773 14.1999 72.15 14.1813C72.5314 14.1533 72.9041 14.1112 73.2682 14.0552L73.3852 14.9796C73.0125 15.0916 72.6268 15.171 72.228 15.2177C71.8379 15.2737 71.3482 15.3017 70.7587 15.3017C69.9006 15.3017 69.2115 15.143 68.6914 14.8255C68.1799 14.4987 67.8072 13.9712 67.5732 13.2429C67.3478 12.5146 67.2351 11.5342 67.2351 10.3017C67.2351 9.06922 67.3478 8.08883 67.5732 7.36054C67.8072 6.63224 68.1799 6.10937 68.6914 5.79191C69.2115 5.46511 69.9006 5.30171 70.7587 5.30171Z"
            />
            <path
              d="M76.1328 5.46978V15.1336H74.9886V5.46978H76.1328ZM80.4106 9.43336V10.4978H76.0288V9.43336H80.4106ZM81.4117 5.46978V15.1336H80.2675V5.46978H81.4117Z"
            />
            <path
              d="M87.1844 5.46978C87.2884 5.46978 87.3794 5.50246 87.4574 5.56782C87.5355 5.62384 87.5875 5.70321 87.6135 5.80591L90.5 15.1336H89.3168L86.9894 7.20647C86.9547 7.07575 86.9157 6.94504 86.8723 6.81432C86.8377 6.67426 86.803 6.54354 86.7683 6.42216H86.4043C86.3696 6.54354 86.3349 6.67426 86.3002 6.81432C86.2656 6.94504 86.2266 7.07575 86.1832 7.20647L83.8558 15.1336H82.6726L85.5591 5.80591C85.5851 5.70321 85.6371 5.62384 85.7151 5.56782C85.7931 5.50246 85.8842 5.46978 85.9882 5.46978H87.1844ZM88.8487 11.044V12.1084H84.2979V11.044H88.8487Z"
            />
          </svg>
        </div>
      </div>
    </div>
  </div>
</main>

<style lang="scss">
  .captcha-container {
    position: relative;
    width: 100%;
  }
  .captcha-button {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
    width: 100%;
    height: 50px;
    background: linear-gradient(180deg, #ffffff 0%, #f4f4f4 100%);
    border: 1px solid #cccccc;
    transition: border 0.6s ease-out;
    border-radius: 4px;
    overflow: hidden;
    cursor: pointer;
    -webkit-user-select: none;
    user-select: none;

    .left-border {
      content: '';
      position: absolute;
      width: 6px;
      height: 48px;
      left: 0;
      top: 0;
      background-color: #5682fd;
      transition: background-color 0.3s 0s ease-out;
    }

    span {
      font-family: 'Inter', 'Noto Sans SC', sans-serif;
      font-style: normal;
      font-weight: 500;
      font-size: 15px;
      line-height: 18px;
      color: #292f3a;
      margin-left: 25px;
    }

    .logo {
      margin-right: 15px;
      path {
        fill: #c7cdda;
      }
    }

    @mixin button-down {
      background: linear-gradient(180deg, #f4f4f4 0%, #ffffff 100%);
      .logo path {
        fill: #a4afc6;
      }
    }

    &:hover {
      @include button-down;
    }

    &.loading {
      transition: border 0.3s ease-out;
      border: 1px solid #c583e0;
      .left-border {
        transition: background-color 0.3s 0s ease-out;
        background-color: #c779d0;
      }
      @include button-down;
    }

    &.solving {
      transition: border 0.3s ease-out;
      border: 1px solid #5682fd;
      @include button-down;
    }

    &.success {
      border: 1px solid #39c422;
      background: linear-gradient(0deg, #f3fdec, #f3fdec),
        linear-gradient(180deg, #f4f4f4 0%, #ffffff 100%);

      .left-border {
        background-color: #39c422;
      }

      span {
        color: #39c422;
      }

      .logo path {
        fill: #98cf8f;
      }
    }
  }

  .captcha-box {
    position: absolute;
    border: 1px solid #cccccc;
    border-radius: 5px;
    bottom: -50%;
    left: 50%;
    margin-bottom: -50px;
    margin-left: -160px;
    z-index: 1000;
    width: 280px;
    padding: 23px;
    background: white;
    -webkit-user-select: none;
    user-select: none;
    touch-action: pan-y;
    overflow: hidden;
    transition: opacity 0.5s ease-out;

    .banner {
      position: absolute;
      height: 6px;
      left: 0;
      top: 0;
      background-color: #5682fd;
      transition: background-color 0.5s linear;

      &.open {
        width: 100%;
        animation: open 0.4s linear;

        @keyframes open {
          0% {
            width: 0%;
          }

          100% {
            width: 100%;
          }
        }
      }

      &.close {
        width: 100%;
        transition: transform 0.4s linear;
        transform: translateX(350px);
      }

      &.success {
        background-color: #39c522;
      }

      &.error {
        background-color: #f05757;
      }
    }

    .tip {
      font-family: 'Inter', 'Noto Sans SC', sans-serif;
      font-style: normal;
      font-weight: 500;
      font-size: 15px;
      line-height: 18px;
      color: #292f3a;
      text-align: center;
      margin-bottom: 17px;
    }

    .widget {
      margin-bottom: 25px;
      text-align: center;
      .spinner {
        border-radius: 50%;
        width: 80px;
        height: 80px;
      }
    }

    .slider {
      position: relative;
      height: 38px;
      touch-action: none;

      .track {
        position: relative;
        background: #dee3eb;
        box-shadow: inset 0px 0px 3.8px rgba(0, 0, 0, 0.1);
        border-radius: 59.85px;
        left: 0;
        height: 17.1px;
      }

      .button {
        position: absolute;
        display: flex;
        top: 0;
        margin: -15px 0 0 -5px;
        width: 65px;
        height: 45px;
        justify-content: center;
        align-items: center;
        background: linear-gradient(180deg, #6d93fd 0%, #5682fd 100%);
        box-shadow: inset 0px -1.9px 0px rgba(0, 0, 0, 0.15);
        border-radius: 34.2px;
        cursor: pointer;

        &.shake {
          animation: shake 800ms ease-in-out;
          transition: left 0.4s linear;
        }

        @keyframes shake {
          10%,
          90% {
            transform: translateX(-1px);
          }
          20%,
          80% {
            transform: translateX(+2px);
          }
          30%,
          70% {
            transform: translateX(-3px);
          }
          40%,
          60% {
            transform: translateX(+3px);
          }
          50% {
            transform: translateX(-3px);
          }
        }
      }
    }

    .toolbar {
      display: flex;
      margin: 10px -5px -10px -5px;
      align-items: center;
      justify-content: space-between;

      .toolbar-left {
        display: flex;
        align-items: center;

        > div {
          position: relative;
          border: 0;
          padding: 0;
          outline: none;
          background-color: transparent;
          cursor: pointer;
          margin-right: 9px;

          > svg path {
            transition: fill 0.5s ease-out;
            fill: #7e7e7e;
          }

          &:hover svg path {
            fill: #4d4d4d;
          }
        }
      }

      .toolbar-right {
        > svg path {
          transition: fill 0.5s ease-out;
          fill: #b9bdc7;
        }
        &:hover {
          > svg path {
            fill: #a4afc6;
          }
        }
      }
    }
  }
</style>
