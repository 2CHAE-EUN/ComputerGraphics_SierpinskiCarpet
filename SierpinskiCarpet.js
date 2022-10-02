"use strict";

var canvas;
var gl;
var i;

var points = [];
var NumTimesToSubdivide = 5;

//onload함수로 시작함
window.onload = function init() {
  // onload : 모든 코드가 로드 된 후 실행이 시작할 위치를 지정

  canvas = document.getElementById("gl-canvas");
  gl = WebGLUtils.setupWebGL(canvas);
  // 캔버스가 HTML 파일로 부터 WebGL context를 읽어온다.

  if (!gl) {
    alert("WebGL 사용 불가능");
  }

  // 사각형을 만들 4개의 점인 꼭짓점의 위치를 (0,0)을 기준으로 초기화 해준다.
  var vertices = [vec2(-1, 1), vec2(1, 1), vec2(1, -1), vec2(-1, -1)];

  // WebGL은 삼각형으로 모델링을 하기 때문에 다각형을 삼각형으로 세분화 해야 한다.
  divideTriangle(
    vertices[0],
    vertices[1],
    vertices[2],
    vertices[3],
    NumTimesToSubdivide
  );

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  // clearColor() : 색을 초기화하는 함수
  // 1~3번째는 각각 R,G,B 값을 표현하고 4번째는 투명도를 표현한다. ( 모두 0~1 사이)

  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  //initShaders를 사용하여 shaeder를 로드, 컴파일, 링크하여 프로그램 객체를 형성한다.
  gl.useProgram(program);

  // 응용 프로그램에서 GPU로 색상 보내기
  // vertex buffer object를 GPU에 생성함으로써 데이터를 GPU에 로드한다.
  var bufferId = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);
  // flatten()을 사용하여 JS 배열을 float32의 배열로 변환

  //마지막으로 프로그램 내의 변수와 shader의 변수를 반드시 연결해야한다.
  //( 버퍼 내의 이름, 타입, 위치가 필요하다. )
  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  render();
};

// 삼각형 하나 그리기
function triangle(a, b, c, d) {
  points.push(a, b, c, d);
}

// 삼각형 분할
function divideTriangle(a, b, c, d, count) {
  if (count === 0) {
    // 분할 횟수를 체크하다가 더 이상 분할이 진행되지 않을 경우
    triangle(a, b, c, d);
  } else {
    // mix 함수를 사용해서 직선 사이에 있는 점 2개를 선형적으로 계산한다.
    // a : (-1,1)
    // b : (1,1)
    // c : (1,-1)
    // d : (-1,-1)

    var ab1 = mix(a, b, 1 / 3);
    var ab2 = mix(a, b, 2 / 3);

    var bc1 = mix(b, c, 1 / 3);
    var bc2 = mix(b, c, 2 / 3);

    var cd1 = mix(c, d, 1 / 3);
    var cd2 = mix(c, d, 2 / 3);

    var da1 = mix(d, a, 1 / 3);
    var da2 = mix(d, a, 2 / 3);

    var centerA = mix(da2, bc1, 1 / 3);
    var centerB = mix(da2, bc1, 2 / 3);
    var centerC = mix(da1, bc2, 2 / 3);
    var centerD = mix(da1, bc2, 1 / 3);

    --count;

    // 새로운 사각형 8개를 만들어 준다.
    // ( 가운데 정사각형은 제거하기 때문에 만들 필요 없다.)

    //1번
    divideTriangle(a, ab1, centerA, da2, count);
    //2번
    divideTriangle(ab1, ab2, centerB, centerA, count);
    //3번
    divideTriangle(ab2, b, bc1, centerB, count);
    //4번
    divideTriangle(da2, centerA, centerD, da1, count);
    //5번
    divideTriangle(centerB, bc1, bc2, centerC, count);
    //6번
    divideTriangle(da1, centerD, cd2, d, count);
    //7번
    divideTriangle(centerD, centerC, cd1, cd2, count);
    //8번
    divideTriangle(centerC, bc2, c, cd1, count);
  }
}

// 랜더링 함수
function render() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  for (i = 0; i < points.length; i = i + 4) {
    gl.drawArrays(gl.TRIANGLE_FAN, i, 4);
  }
}
