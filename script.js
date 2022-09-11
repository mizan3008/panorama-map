window.onload = function() {
    _buildImageList()
}

const images = []
let activeIndex = null
let hotspotId = null
let viewer = null

const hotspots = []

const payload = []

function _getPayload()
{
    // const finalPayload = []

    // payload.forEach((data, index) => {

    //     let nextIndex = index + 1
    //     if(!payload[nextIndex]){
    //         nextIndex = 0
    //     }

    //     finalPayload.push(
    //         {
    //             id: index,
    //             name: index,
    //             image: data.path,
    //             pitch: data.pitch,
    //             yaw: data.yaw,
    //             toCoordinates: {
    //                 pitch: data.hotspots[0].pitch ?? 0,
    //                 yaw: data.hotspots[0].yaw ?? 0,
    //                 to: nextIndex
    //             },
    //             fromCoordinates: {
    //                 pitch: data.hotspots[1].pitch ?? 0,
    //                 yaw: data.hotspots[1].yaw ?? 0,
    //                 to: 0
    //             },
    //         }
    //     )
    // })

    console.log(payload)
    console.log(viewer.getConfig())
}
function _enableHotspotClickEvent(id)
{
    hotspotId = id
    document.getElementById('panorama').addEventListener("click", _clickEvent)    
}

function _clearMouseEvent()
{
    document.getElementById('panorama').removeEventListener("click", _clickEvent)
}

function _clickEvent(e)
{
    e.preventDefault()
    const hotspots = payload[activeIndex].hotspots ?? []

    const hotspotPayload = viewer.mouseEventToCoords(e)
    // console.log(hotspots.indexOf((hp) => hp.id !== hotspotId))
    // const hotspotId = activeIndex + "-" + hotspots.length

    const text = "Hotspot " + hotspotId

    const data = {
        id: hotspotId.toString(),
        text: text,
        pitch: hotspotPayload[0],
        yaw: hotspotPayload[1]
    }

    viewer.addHotSpot(data)

    hotspots.push(data)

    const uniqueHotspots = []

    hotspots.forEach((hotspot) => {
        if(uniqueHotspots.indexOf(hotspot) === -1){
            uniqueHotspots.push(hotspot)
        }
    })


    payload[activeIndex].hotspots = uniqueHotspots
    _buildControlPanel()

    // remove duplicate data form payload[activeindex].hotspots

    _clearMouseEvent()
}

function _removeHotspot(id)
{
    viewer.removeHotSpot(id)

    const hotspots = payload[activeIndex].hotspots ?? []

    if(hotspots.length > 0){
        payload[activeIndex].hotspots = hotspots.filter((hotspot) => hotspot.id !== id)
        // _buildControlPanel()
        _loadPanorama(activeIndex)
    }
}

function _addImage()
{
    const imagePath = prompt("Insert panoramic image path")
    if(imagePath !== "" || imagePath !== null){

        const paths = imagePath.split(',')
        paths.forEach((path) => {
            payload.push({
                path: path,
                pitch: 0,
                yaw: 0,
                hotspots: []
            })
        })

        if(activeIndex === null){
            activeIndex = 0
            _loadPanorama(0)
        }

        _buildControlPanel()

        // if(payload.length === 1){
        //     _loadPanorama(0)
        // }
    }
}

function _buildControlPanel()
{
    _buildImageList()
    _buildHotspotControl()
}

function _buildImageList()
{
    let html = ""

    if(payload.length > 0){
        payload.forEach((data, index) => {
            const activeClass = index === activeIndex ? 'border-green-500' : ''
            html += "<li id='item-image-"+index+"' class='border-2 mb-1 "+ activeClass +" item-images'><div class='flex'><a class='flex' href='javascript:_loadPanorama("+index+")'><div class='mr-3 w-12'><img src='"+data.path+"'/></div><div>Image-"+index+"</div></a><a class='text-red-700' href='javascript:_removeImage("+index+")'><svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='currentColor' class='w-5 h-5'><path stroke-linecap='round' stroke-linejoin='round' d='M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0'/></svg></a></div></li>"
        })
    }else{
        html += "<li class='border-2'>No images</li>"
    }

    document.getElementById('image-list').innerHTML = html
}

function _removeImage(index)
{
    const command = confirm("Are you sure, you want to remove this image?")
    if(command){
        payload.splice(index, 1)
        _buildControlPanel()
    }

    // ToDo: need to handle situation if the active image is removed
}

function _buildHotspotControl()
{
    const from_coordinate_id = activeIndex + "_from"
    const to_coordinate_id = activeIndex + "_to"

    let html = ""

    html += "<div class='mt-2'>"
    html += "<div>Hotspot</div>"
    html += "<ul class='list-none'>"

    const hotspots = payload[activeIndex].hotspots ?? []

    if(hotspots.find((hotspot) => hotspot.id === from_coordinate_id) === undefined){
        html += "<li><a class='bg-gray-400 p-1 text-sm rounded w-full inline-flex items-center' href='javascript:_enableHotspotClickEvent(&#39;"+from_coordinate_id+"&#39;)'><svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='currentColor' class='w-6 h-6 mr-2'><path stroke-linecap='round' stroke-linejoin='round' d='M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5' /></svg> Add from coordinate</a></li>"        
    }else{
        html += "<li class='border-2 w-full inline-flex items-center'>From coordinate <a href='javascript:_removeHotspot(&#39;"+from_coordinate_id+"&#39;)'><svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='currentColor' class='w-5 h-5'><path stroke-linecap='round' stroke-linejoin='round' d='M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0'/></svg></a></li>"
    }

    if(hotspots.find((hotspot) => hotspot.id === to_coordinate_id) === undefined){
        html += "<li><a class='bg-gray-400 p-1 text-sm rounded w-full inline-flex items-center' href='javascript:_enableHotspotClickEvent(&#39;"+to_coordinate_id+"&#39;)'><svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='currentColor' class='w-6 h-6 mr-2'><path stroke-linecap='round' stroke-linejoin='round' d='M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5' /></svg> Add to coordinate</a></li>"        
    }else{
        html += "<li class='border-2 w-full inline-flex items-center'>To coordinate <a href='javascript:_removeHotspot(&#39;"+to_coordinate_id+"&#39;)'><svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='currentColor' class='w-5 h-5'><path stroke-linecap='round' stroke-linejoin='round' d='M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0'/></svg></a></li>"
    }

    html += "</ul>"
    html += "</div>"

    document.getElementById('hotspot-control').innerHTML = html
}

function _loadPanorama(index)
{
    activeIndex = index

    // document.getElementByClassName('item-images').remove('bg-sky-700')
    // document.getElementById('item-image-'+index).add('bg-sky-700')

    _buildControlPanel()

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