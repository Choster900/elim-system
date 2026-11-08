import type {
    NiimbotBluetoothClientConnectOptions,
    NiimbotSerialClientConnectOptions,
} from '@mmote/niimbluelib'
import type { LabelPrinterDevice, LabelPrinterSupport } from '../../label-printer.types'

export type NiimbotTransport = 'bluetooth' | 'serial'

export type AuthorizedBluetoothDevice = NonNullable<
    NiimbotBluetoothClientConnectOptions['authorizedDevice']
>
export type AuthorizedSerialPort = NonNullable<NiimbotSerialClientConnectOptions['authorizedPort']>

interface UsbPortInfo {
    usbVendorId?: number
    usbProductId?: number
}

interface WebHardwareNavigator {
    bluetooth?: { getDevices?: () => Promise<AuthorizedBluetoothDevice[]> }
    serial?: { getPorts?: () => Promise<AuthorizedSerialPort[]> }
}

const SERIAL_DEVICE_ID_PREFIX = 'serial-'

function webHardware() {
    if (typeof window === 'undefined' || !window.isSecureContext) return null
    return window.navigator as unknown as WebHardwareNavigator
}

function formatUsbId(value?: number) {
    return value === undefined ? '????' : value.toString(16).padStart(4, '0').toUpperCase()
}

const TRANSPORT_API_NAMES: Record<NiimbotTransport, string> = {
    bluetooth: 'Bluetooth',
    serial: 'USB (Web Serial)',
}

function isAppleMobileDevice() {
    const { userAgent, maxTouchPoints } = window.navigator
    return /iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1)
}

export function checkTransportSupport(transport: NiimbotTransport): LabelPrinterSupport {
    if (typeof window === 'undefined') {
        return { supported: false, reason: 'Solo disponible en el navegador.' }
    }
    if (webHardware()?.[transport]) return { supported: true }
    if (isAppleMobileDevice()) {
        return {
            supported: false,
            reason: 'En iPhone y iPad ningún navegador puede conectar impresoras desde una página web: Chrome, Edge y Safari usan ahí el mismo motor de Apple, que no incluye Bluetooth ni USB. Usa una computadora con Chrome o Edge, o un teléfono Android con Chrome.',
        }
    }
    if (!window.isSecureContext) {
        return {
            supported: false,
            reason: `El navegador bloquea Bluetooth y USB porque abriste el sistema por HTTP (${window.location.host}). Ábrelo con HTTPS, o desde localhost en la misma computadora donde corre el sistema.`,
        }
    }
    return {
        supported: false,
        reason: `Este navegador no admite ${TRANSPORT_API_NAMES[transport]}. Usa Chrome o Edge actualizados.`,
    }
}

export async function listAuthorizedBluetoothDevices() {
    const bluetooth = webHardware()?.bluetooth
    return bluetooth?.getDevices ? bluetooth.getDevices() : []
}

export async function listAuthorizedSerialPorts() {
    const serial = webHardware()?.serial
    return serial?.getPorts ? serial.getPorts() : []
}

export function describeBluetoothDevice(device: AuthorizedBluetoothDevice): LabelPrinterDevice {
    return { id: device.id, name: device.name || 'Impresora Bluetooth' }
}

export function describeSerialPort(port: AuthorizedSerialPort, index: number): LabelPrinterDevice {
    const { usbVendorId, usbProductId } = port.getInfo() as UsbPortInfo
    return {
        id: `${SERIAL_DEVICE_ID_PREFIX}${index}`,
        name: `USB ${formatUsbId(usbVendorId)}:${formatUsbId(usbProductId)}`,
    }
}

export async function findAuthorizedBluetoothDevice(deviceId: string) {
    const devices = await listAuthorizedBluetoothDevices()
    return devices.find((device) => device.id === deviceId)
}

export async function findAuthorizedSerialPort(deviceId: string) {
    const ports = await listAuthorizedSerialPorts()
    return ports.find((port, index) => describeSerialPort(port, index).id === deviceId)
}
