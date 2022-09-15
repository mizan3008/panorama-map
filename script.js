window.onload = function() {
    _buildImageList()
}

const images = []
let activeIndex = null
let hotspotId = null
let viewer = null
let previewer = null

const hotspots = []

const payload = []

const typeList = ['Unit', 'Level', 'Block']

function _getPayload()
{
    const finalPayload = []

    payload.forEach((data, index) => {

        const toPayload = payload[index + 1] ?? payload[0]
        const fromPayload = payload[index - 1] ?? payload[payload.length - 1]

        const myPayload = {
            name: data.name,
            label: data.label,
            type: data.type,
            image: data.path,
            pitch: data.pitch,
            yaw: data.yaw,
        }

        const hotspots = data.hotspots ?? []

        if(hotspots.length > 0){
            hotspots.forEach((hotspot) => {
                if(hotspot.id.search('from') !== -1){
                    myPayload.fromCoordinates = {
                        pitch: hotspot.pitch ?? 0,
                        yaw: hotspot.yaw ?? 0,
                        to: fromPayload.name
                    }
                }
                if(hotspot.id.search('to') !== -1){
                    myPayload.toCoordinates = {
                        pitch: hotspot.pitch ?? 0,
                        yaw: hotspot.yaw ?? 0,
                        to: toPayload.name
                    }
                }
            })
        }

        finalPayload.push(myPayload)
    })

    return finalPayload
}

function _copy() {

    const payload = {
        payload: _getPayload()
    }

    const input = document.createElement('input');
    input.setAttribute('value', JSON.stringify(payload));
    document.body.appendChild(input);
    input.select();
    const result = document.execCommand('copy');
    document.body.removeChild(input);
    alert('The payload has been copied to the clipboard.')
    return result;
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

function __getConfig(e)
{
    e.preventDefault()
    payload[activeIndex].pitch = viewer.getPitch()
    payload[activeIndex].yaw = viewer.getYaw()
}

function _clickEvent(e)
{
    e.preventDefault()

    const activePayload = payload[activeIndex]

    const hotspots = activePayload.hotspots ?? []

    const hotspotPayload = viewer.mouseEventToCoords(e)

    const data = {
        id: hotspotId.toString(),
        text: hotspotId.search('from') !== -1 ? 'From Coordinate' : 'To Coordinate',
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

    activePayload.hotspots = uniqueHotspots
    activePayload.yaw = viewer.getYaw()
    activePayload.pitch = viewer.getPitch()
    _buildControlPanel()
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
            if(path !== ""){
                payload.push({
                    name: '',
                    label: '',
                    type: 'unit',
                    path: path,
                    pitch: 0,
                    yaw: 0,
                    hotspots: []
                })
            }
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
            html += "<li id='item-image-"+index+"' class='border-2 mb-1 "+ activeClass +" item-images'><div class='flex'><a class='flex' href='javascript:_loadPanorama("+index+")'><div class='mr-3 w-12'><img src='"+data.path+"'/></div><div>Image-"+index+"</div></a><a class='text-red-700 hidden' href='javascript:_removeImage("+index+")'><svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='currentColor' class='w-5 h-5'><path stroke-linecap='round' stroke-linejoin='round' d='M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0'/></svg></a></div></li>"
        })
    }else{
        html += "<li class='border-2'>No images</li>"
    }

    document.getElementById('image-list').innerHTML = html
}

function _removeImage(index)
{
    return false

    const command = confirm("Are you sure, you want to remove this image?")
    if(command){
        payload.splice(index, 1)
        _buildControlPanel()
    }

    // ToDo: need to handle situation if the active image is removed
}

function _setName(e)
{
    const activePayload = payload[activeIndex]
    activePayload.name = e.value
}

function _setLabel(e)
{
    const activePayload = payload[activeIndex]
    activePayload.label = e.value
}

function _setType(e)
{
    const activePayload = payload[activeIndex]
    activePayload.type = e.value
}

function _buildHotspotControl()
{
    const activePayload = payload[activeIndex]

    const from_coordinate_id = activeIndex + "_from"
    const to_coordinate_id = activeIndex + "_to"

    const name = activePayload.name ?? ''
    const label = activePayload.label ?? ''

    let html = ""

    let typeOptionHtml = ""
    typeList.forEach((type) => {
        let selected = activePayload.type === type.toLocaleLowerCase() ? 'selected' : ''
        typeOptionHtml += "<option "+selected+" value='"+type.toLocaleLowerCase()+"'>"+type+"</option>"
    })

    html += "<div class='mt-2'>"
    html += "<label>Name</label>"
    html += "<div class='flex'>"
    html += "<div><input type='text' class='border-2 w-full' onkeyup='javascript:_setName(this);' name='name' value='"+name+"'/></div>"
    html += "<div><select class='border-2 h-full' onchange='javascript:_setType(this)'>"+typeOptionHtml+"</select></div>"
    html += "</div>"
    html += "</div>"

    html += "<div class='mt-2'>"
    html += "<label>Label</label>"
    html += "<div>"
    html += "<input type='text' class='border-2 w-full' onkeyup='javascript:_setLabel(this);' name='label' value='"+label+"'/>"
    html += "</div>"
    html += "</div>"

    html += "<div class='mt-2'>"
    html += "<div>Hotspot</div>"
    html += "<ul class='list-none'>"

    const hotspots = activePayload.hotspots ?? []

    if(hotspots.find((hotspot) => hotspot.id === to_coordinate_id) === undefined){
        html += "<li class='mb-1'><a class='bg-gray-400 p-1 text-sm rounded w-full inline-flex items-center' href='javascript:_enableHotspotClickEvent(&#39;"+to_coordinate_id+"&#39;)'><svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='currentColor' class='w-6 h-6 mr-2'><path stroke-linecap='round' stroke-linejoin='round' d='M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5' /></svg> Add to coordinate</a></li>"        
    }else{
        html += "<li class='border-2 w-full inline-flex items-center mb-1'>To coordinate <a class='text-red-500' href='javascript:_removeHotspot(&#39;"+to_coordinate_id+"&#39;)'><svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='currentColor' class='w-5 h-5'><path stroke-linecap='round' stroke-linejoin='round' d='M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0'/></svg></a></li>"
    }

    if(hotspots.find((hotspot) => hotspot.id === from_coordinate_id) === undefined){
        html += "<li class='mb-1'><a class='bg-gray-400 p-1 text-sm rounded w-full inline-flex items-center' href='javascript:_enableHotspotClickEvent(&#39;"+from_coordinate_id+"&#39;)'><svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='currentColor' class='w-6 h-6 mr-2'><path stroke-linecap='round' stroke-linejoin='round' d='M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5' /></svg> Add from coordinate</a></li>"        
    }else{
        html += "<li class='border-2 w-full inline-flex items-center mb-1'>From coordinate <a class='text-red-500' href='javascript:_removeHotspot(&#39;"+from_coordinate_id+"&#39;)'><svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='currentColor' class='w-5 h-5'><path stroke-linecap='round' stroke-linejoin='round' d='M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0'/></svg></a></li>"
    }

    html += "</ul>"
    html += "</div>"

    document.getElementById('hotspot-control').innerHTML = html
}

function _loadPanorama(index)
{
    activeIndex = index

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

    document.getElementById('panorama').addEventListener("click", __getConfig)
}

function _preview()
{
    const payload = _getPayload()

    const previewPayload = {   
        "default": {
            "firstScene": payload[0].name,
            "sceneFadeDuration": 1000,
            "autoLoad": true
        },
    
        "scenes": {}
    }

    payload.forEach((data) => {

        const hotSpots = []

        if(data.fromCoordinates){
            hotSpots.push({
                "pitch": data.fromCoordinates.pitch,
                "yaw": data.fromCoordinates.yaw,
                "type": "scene",
                "sceneId": data.fromCoordinates.to
            })
        }

        if(data.toCoordinates){
            hotSpots.push({
                "pitch": data.toCoordinates.pitch,
                "yaw": data.toCoordinates.yaw,
                "type": "scene",
                "sceneId": data.toCoordinates.to
            })
        }

        previewPayload['scenes'][data.name] = {
            "pitch": data.pitch,
            "yaw": data.yaw,
            "type": "equirectangular",
            "panorama": data.image,
            "hotSpots": hotSpots
        }
    })

    previewer = pannellum.viewer('panoramicPreview', previewPayload);
    document.getElementById('previewModal').classList.toggle("hidden")
}

function toggleModal(){
    if(previewer){
        previewer.destroy()
    }

    document.getElementById('previewModal').classList.toggle("hidden")
}