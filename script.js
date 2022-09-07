window.onload = function() {
    _buildImageList()
}

const images = []
let activeIndex = null
let viewer = null

const hotspots = []

const payload = []

function _getPayload()
{
    const finalPayload = []

    payload.forEach((data, index) => {

        let nextIndex = index + 1
        if(!payload[nextIndex]){
            nextIndex = 0
        }

        finalPayload.push(
            {
                id: index,
                name: index,
                image: data.path,
                pitch: data.pitch,
                yaw: data.yaw,
                toCoordinates: {
                    pitch: data.hotspots[0].pitch ?? 0,
                    yaw: data.hotspots[0].yaw ?? 0,
                    to: nextIndex
                },
                fromCoordinates: {
                    pitch: data.hotspots[1].pitch ?? 0,
                    yaw: data.hotspots[1].yaw ?? 0,
                    to: 0
                },
            }
        )
    })

    console.log(finalPayload)
}
function _enableHotspotClickEvent()
{
    document.getElementById('panorama').addEventListener("click", _clickEvent)
    
}

function _clearMouseEvent()
{
    document.getElementById('panorama').removeEventListener("click", _clickEvent)
}

function _clickEvent(e)
{
    const hotspots = payload[activeIndex].hotspots ?? []

    const hotspotPayload = viewer.mouseEventToCoords(e)
    
    const hotspotId = activeIndex + "-" + hotspots.length
    const text = "Hotspot " + hotspotId

    const data = {
        id: hotspotId.toString(),
        text: text,
        pitch: hotspotPayload[0],
        yaw: hotspotPayload[1]
    }

    viewer.addHotSpot(data)

    hotspots.push(data)

    payload[activeIndex].hotspots = hotspots
    _clearMouseEvent()
}

function _removeHotspot()
{
    let id = prompt("Please enter hotspot id:", "");
    if (id !== null || id !== "") {
        viewer.removeHotSpot(id)
    }
}

function _addImage()
{
    const imagePath = prompt("Insert panoramic image path")
    if(imagePath !== "" || imagePath !== null){
        payload.push({
            path: imagePath,
            pitch: 0,
            yaw: 0,
            hotspots: []
        })
    }

    _buildImageList()

    if(payload.length === 1){
        _loadPanorama(0)
    }
}

function _buildImageList()
{
    let html = ""

    if(payload.length > 0){
        payload.forEach((data, index) => {
            html += "<li id='item-image-"+index+"' class='border-2 mb-1 item-images'><a class='flex' href='javascript:_loadPanorama("+index+")'><div class='mr-3 w-12'><img src='"+data.path+"'/></div><div>Image-"+index+"</div></a></li>"
        })
    }else{
        html += "<li class='border-2'>No images</li>"
    }

    document.getElementById('image-list').innerHTML = html
}

function _loadPanorama(index)
{
    activeIndex = index

    // document.getElementByClassName('item-images').remove('bg-sky-700')
    // document.getElementById('item-image-'+index).add('bg-sky-700')

    const activePayload = payload[index] ?? []

    if(viewer){
        viewer.destroy()
    }

    viewer = pannellum.viewer('panorama', {
        "type": "equirectangular",
        "panorama": activePayload.path,
        "autoLoad": true,
        "pitch": activePayload.pitch ?? 0,
        "yaw": activePayload.yaw ?? 0,
        "hotSpots": activePayload.hotspots ?? []
    })
}