const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")

const armConstants = {
    anchorLength: 100,
    floatingLength: 100
}

const arm = {
    anchor: 0,
    floating: 0
}

const anchorPosition = {
    x: 0.5 * canvas.width,
    y: canvas.height - 250
}

const findL1Position = () => {
    return {
        x: Math.cos(arm.anchor * Math.PI / 180) * armConstants.anchorLength,
        y: Math.sin(arm.anchor * Math.PI / 180) * armConstants.anchorLength
    }
}

const findL2Position = (pos1) => {
    const angle = arm.anchor - arm.floating

    return {
        x: pos1.x + Math.cos(angle * Math.PI / 180) * armConstants.floatingLength,
        y: pos1.y + Math.sin(angle * Math.PI / 180) * armConstants.floatingLength
    }
}

const draw = () => {
    const pos1 = findL1Position()
    const pos2 = findL2Position(pos1)

    ctx.fillStyle = "black"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // subtract y cuz canvas

    ctx.lineWidth = 10
    ctx.strokeStyle = "red"
    ctx.beginPath()
    ctx.moveTo(anchorPosition.x, anchorPosition.y)
    ctx.lineTo(anchorPosition.x + pos1.x, anchorPosition.y - pos1.y)
    ctx.closePath()
    ctx.stroke()

    ctx.strokeStyle = "blue"
    ctx.beginPath()
    ctx.moveTo(anchorPosition.x + pos1.x, anchorPosition.y - pos1.y)
    ctx.lineTo(anchorPosition.x + pos2.x, anchorPosition.y - pos2.y)
    ctx.closePath()
    ctx.stroke()
}

const calculateAngles = (dz, dy) => {
    const L1 = armConstants.anchorLength
    const L2 = armConstants.floatingLength
    const R = Math.sqrt(dz * dz + dy * dy)

    // out of reach, get as close as possible. also angles become trivial
    if(R > L1 + L2){
        return {
            anchor: 180 / Math.PI * Math.atan2(dy, dz),
            floating: 0
        }
    }

    const theta = Math.atan2(dy, dz)
    const kappa = Math.acos((L1 * L1 + R * R - L2 * L2) / (2 * L1 * R))
    const lambda = Math.acos((L1 * L1 + L2 * L2 - R * R) / (2 * L1 * L2))

    const alpha = theta + kappa
    const beta = Math.PI - lambda

    return {
        anchor: 180 / Math.PI * alpha,
        floating: 180 / Math.PI * beta
    }
}

const calculations = {
    start: calculateAngles(150, -50),
    end: calculateAngles(50, 100)
}

const interpolation = {
    anchor: {
        start: calculations.start.anchor,
        end: calculations.end.anchor,
        duration: 1000
    },
    floating: {
        start: calculations.start.floating,
        end: calculations.end.floating,
        duration: 1000
    }
}

let timestamp = Date.now()
let timeElapsed = 0

const setInterpolatedKinematics = () => {
    arm.anchor = interpolation.anchor.start + Math.min(timeElapsed / interpolation.anchor.duration, 1) * (interpolation.anchor.end - interpolation.anchor.start)
    arm.floating = interpolation.floating.start + Math.min(timeElapsed / interpolation.floating.duration, 1) * (interpolation.floating.end - interpolation.floating.start)
}

document.getElementById("time").addEventListener("input", (e) => {
    timeElapsed = e.target.value * Math.max(interpolation.anchor.duration, interpolation.floating.duration)

    setInterpolatedKinematics()
    draw()
})

canvas.addEventListener("mousemove", (e) => {
    const angles = calculateAngles(e.offsetX - anchorPosition.x, anchorPosition.y - e.offsetY)

    arm.anchor = angles.anchor
    arm.floating = angles.floating

    draw()
})

const interpolateFrame = () => {
    const dt = Date.now() - timestamp
    timestamp = Date.now()
    timeElapsed += dt

    document.getElementById("time").value = timeElapsed / Math.max(interpolation.anchor.duration, interpolation.floating.duration)

    setInterpolatedKinematics()

    if(timeElapsed >= Math.max(interpolation.anchor.duration, interpolation.floating.duration)){
        draw()
    } else {
        draw()
        requestAnimationFrame(interpolateFrame)
    }
}

interpolateFrame()