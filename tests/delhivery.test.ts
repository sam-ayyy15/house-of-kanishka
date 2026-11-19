import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildShipment,
  carrierWords,
  cleanText,
  manifestBody,
  nextStep,
  pickupWindow,
  placeName,
  plainReason,
  readCreate,
  readServiceability,
  readTracking,
  shipmentRef,
  type ShipmentOrder,
} from '../lib/delhivery-core.ts';

const order = (o: Partial<ShipmentOrder> = {}): ShipmentOrder => ({
  number: 'HOK-1042',
  attempt: 0,
  placedAt: '2026-11-18T05:00:00Z',
  paymentMethod: 'cod',
  totalInr: 8100,
  phone: '9876543210',
  shipTo: { full_name: 'Asha Rao', line1: 'Flat #4, A&B Towers', line2: '50% Road; Near Temple', city: 'Udupi', state: 'Karnataka', pincode: '576103' },
  items: [
    { name: 'Rosa Dress', size: 'M', qty: 1 },
    { name: 'Lila Dress', size: 'S', qty: 2 },
  ],
  ...o,
});
const parcel = { weightG: 600, lengthCm: 30, widthCm: 25, heightCm: 6 };
const seller = { name: 'House of Kanishka', address: 'Ambalpadi Junction, NH 66, Ambalpady, Udupi' };

test('cleanText replaces the characters Delhivery refuses, keeping their meaning', () => {
  assert.equal(cleanText('Flat #4, A&B Towers; 50% Road \\ back'), 'Flat No. 4, A and B Towers 50 percent Road back');
  assert.equal(cleanText(null), '');
  assert.equal(cleanText('x'.repeat(300), 10).length, 10);
});

test('shipmentRef: the order number first, a suffix after each cancelled booking', () => {
  assert.equal(shipmentRef('HOK-1042', 0), 'HOK-1042');
  assert.equal(shipmentRef('HOK-1042', 1), 'HOK-1042-2');
  assert.ok(shipmentRef('HOK-9999999999', 98).length < 50);
});

test('buildShipment: cash on delivery collects the full total; no forbidden characters anywhere', () => {
  const s = buildShipment(order(), parcel, seller);
  assert.equal(s.payment_mode, 'COD');
  assert.equal(s.cod_amount, 8100);
  assert.equal(s.total_amount, 8100);
  assert.equal(s.pin, 576103);
  assert.equal(typeof s.pin, 'number');
  assert.equal(s.phone, '9876543210');
  assert.equal(s.order, 'HOK-1042');
  assert.equal(s.quantity, '3');
  assert.equal(s.weight, 600);
  assert.equal(s.shipment_height, 6);
  assert.equal(s.order_date, '2026-11-18');
  assert.equal(s.seller_inv, 'HOK-1042');
  assert.equal(s.waybill, '');
  assert.equal(s.transport_speed, 'D');
  for (const v of Object.values(s)) if (typeof v === 'string') assert.doesNotMatch(v, /[&%#;\\]/);
  assert.match(s.add, /Flat No\. 4, A and B Towers, 50 percent Road Near Temple/);
  assert.match(s.products_desc, /Rosa Dress \(M\) x 1, Lila Dress \(S\) x 2/);
});

test('buildShipment: prepaid collects nothing; a re-booking uses the suffixed reference', () => {
  const s = buildShipment(order({ paymentMethod: 'online', attempt: 1, phone: '+91 98765 43210' }), parcel, seller, ' 123456789012 ');
  assert.equal(s.payment_mode, 'Prepaid');
  assert.equal(s.cod_amount, 0);
  assert.equal(s.order, 'HOK-1042-2');
  assert.equal(s.phone, '9876543210');
  assert.equal(s.ewbn, '123456789012');
});

test('manifestBody is format=json&data=<json>, URL-encoded', () => {
  const body = manifestBody('HoK Udupi', [buildShipment(order(), parcel, seller)]);
  const params = new URLSearchParams(body);
  assert.equal(params.get('format'), 'json');
  const data = JSON.parse(params.get('data')!);
  assert.equal(data.pickup_location.name, 'HoK Udupi');
  assert.equal(data.shipments.length, 1);
  assert.ok(body.startsWith('format=json&data='));
});

test('readCreate: the waybill on success, Delhivery’s words otherwise', () => {
  assert.deepEqual(readCreate({ success: true, packages: [{ status: 'Success', waybill: '7160510000431', remarks: [''] }] }), { waybill: '7160510000431' });
  assert.deepEqual(readCreate({ success: false, rmk: 'ClientWarehouse matching query does not exist.' }), { reason: 'ClientWarehouse matching query does not exist.', duplicate: false });
  const dup = readCreate({ success: false, packages: [{ status: 'Fail', remarks: ['Duplicate Order Id'] }] });
  assert.ok('reason' in dup && dup.duplicate);
  assert.ok('reason' in readCreate(null));
});

test('readServiceability: empty = not served, Embargo = paused, cod / prepaid flags when present', () => {
  assert.deepEqual(readServiceability({ delivery_codes: [] }), { deliverable: false, embargo: false, cod: null, prepaid: null });
  assert.deepEqual(readServiceability({ delivery_codes: [{ postal_code: [{ remark: '' }] }] }), { deliverable: true, embargo: false, cod: null, prepaid: null });
  assert.deepEqual(readServiceability({ delivery_codes: [{ postal_code: [{ remark: 'Embargo' }] }] }), { deliverable: false, embargo: true, cod: null, prepaid: null });
  // Delhivery's live answer (Udupi, 19 Nov 2026): `remarks`, and Y/N flags.
  const live = { delivery_codes: [{ postal_code: { remarks: '', pin: 576103, cod: 'Y', pre_paid: 'Y', pickup: 'Y', is_oda: 'N', district: 'Udupi' } }] };
  assert.deepEqual(readServiceability(live), { deliverable: true, embargo: false, cod: true, prepaid: true });
  assert.deepEqual(readServiceability({ delivery_codes: [{ postal_code: { remarks: 'Embargo', cod: 'Y', pre_paid: 'Y' } }] }).embargo, true);
  assert.deepEqual(readServiceability({ delivery_codes: [{ postal_code: { remarks: '', cod: 'N', pre_paid: 'Y' } }] }), { deliverable: true, embargo: false, cod: false, prepaid: true });
  assert.deepEqual(readServiceability({ delivery_codes: [{ postal_code: { remarks: '', cod: 'Y', pre_paid: 'N' } }] }), { deliverable: true, embargo: false, cod: true, prepaid: false });
  assert.equal(readServiceability({ delivery_codes: [{ postal_code: { remarks: '', cod: 'N', pre_paid: 'N' } }] }).deliverable, false);
  assert.equal(readServiceability(null).deliverable, false);
});

const shipment = (status: string, type: string, extra: Record<string, unknown> = {}) => ({
  ShipmentData: [
    {
      Shipment: {
        AWB: '7160510000431',
        ReferenceNo: 'HOK-1042',
        PickedupDate: null,
        ExpectedDeliveryDate: '2026-11-21T00:00:00',
        Status: { Status: status, StatusType: type, StatusLocation: 'Udupi_Ambalpady_D (Karnataka)', StatusDateTime: '2026-11-19T15:10:00+05:30' },
        Consignee: { Address1: [], Address2: [] },
        ...extra,
      },
    },
  ],
});

test('readTracking reads Delhivery’s nested answer safely', () => {
  const [t] = readTracking(shipment('In Transit', 'UD', { PickedupDate: '2026-11-19T11:00:00' }));
  assert.equal(t.waybill, '7160510000431');
  assert.equal(t.ref, 'HOK-1042');
  assert.equal(t.location, 'Udupi_Ambalpady_D (Karnataka)');
  assert.equal(t.at, '2026-11-19T09:40:00.000Z');
  assert.ok(t.expectedAt);
  assert.equal(t.pickedUp, true);
  assert.equal(t.delivered, false);
  assert.deepEqual(readTracking({ Success: false, Error: 'Data does not exists' }), []);
  assert.deepEqual(readTracking({ ShipmentData: [{ Shipment: { Status: null } }] }), []);
});

test('nextStep: collected → shipped, delivered → delivered, RTO → returning, waiting → nothing', () => {
  const step = (status: string, type: string, orderStatus = 'packed', extra = {}) => nextStep(orderStatus, readTracking(shipment(status, type, extra))[0]);
  assert.equal(step('Manifested', 'UD'), 'none');
  assert.equal(step('Not Picked', 'UD'), 'none');
  assert.equal(step('In Transit', 'UD'), 'shipped');
  assert.equal(step('In Transit', 'UD', 'shipped'), 'none');
  assert.equal(step('Dispatched', 'UD', 'shipped'), 'none');
  assert.equal(step('Delivered', 'DL', 'shipped'), 'delivered');
  assert.equal(step('Delivered', 'DL', 'packed'), 'delivered');
  assert.equal(step('In Transit', 'RT', 'shipped'), 'returning');
  assert.equal(step('RTO', 'DL', 'shipped'), 'returning');
  assert.equal(step('Delivered', 'DL', 'delivered'), 'none');
  assert.equal(step('Delivered', 'DL', 'cancelled'), 'none');
});

test('carrierWords and placeName speak to customers plainly', () => {
  assert.equal(carrierWords('Dispatched', 'UD'), 'Out for delivery');
  assert.equal(carrierWords('In Transit', 'UD'), 'In transit');
  assert.equal(carrierWords('Pending', 'UD'), 'At the delivery centre');
  assert.equal(carrierWords('Manifested', 'UD'), 'Waiting for the courier to collect it');
  assert.equal(carrierWords('In Transit', 'RT'), 'Returning to us');
  assert.equal(carrierWords('LOST', 'LT'), 'Lost');
  assert.equal(carrierWords(null), null);
  assert.equal(placeName('Udupi_Ambalpady_D (Karnataka)'), 'Udupi Ambalpady D (Karnataka)');
  assert.equal(placeName(''), null);
});

test('pickupWindow: today to 7 days ahead, in India dates', () => {
  // 20:00 UTC on 18 Nov is already 19 Nov in India.
  assert.deepEqual(pickupWindow(new Date('2026-11-18T20:00:00Z')), { first: '2026-11-19', last: '2026-11-26' });
});

test('plainReason turns Delhivery’s refusals into plain words', () => {
  assert.match(plainReason("Crashing while saving package due to exception 'Prepaid client manifest charge API failed due to insufficient balance'. Package might have been partially saved."), /wallet balance is too low/);
  assert.match(plainReason('ClientWarehouse matching query does not exist.'), /pickup location name/);
  assert.match(plainReason('Shipment status cannot be changed as shipment is either picked up or already in return flow'), /already collected/);
  assert.equal(plainReason('Something new'), 'Something new');
});
