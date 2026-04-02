import { describe, expect, it } from "vitest";
import { DocumentClass } from "../../src/entity/DocumentClass";
import { IntegrityStatusEnum } from "../../src/value-objects/IntegrityStatusEnum";

describe("DocumentClass entity", () => {

    describe("constructor", () => {
        // identifier: TU-F-browsing-16
        // method_name: assegna()
        // description: should assegna dipUuid, uuid, name e timestamp
        // expected_value: matches asserted behavior: assegna dipUuid, uuid, name e timestamp
        it("TU-F-browsing-16: assegna() should assegna dipUuid, uuid, name e timestamp", () => {
            const dc = new DocumentClass("dip-uuid", "dc-uuid", "Contratti", "2024-01-01T00:00:00Z");
            expect(dc.getDipUuid()).toBe("dip-uuid");
            expect(dc.getUuid()).toBe("dc-uuid");
            expect(dc.getName()).toBe("Contratti");
            expect(dc.getTimestamp()).toBe("2024-01-01T00:00:00Z");
        });

        // identifier: TU-F-browsing-17
        // method_name: imposta()
        // description: should imposta integrityStatus a UNKNOWN di default
        // expected_value: matches asserted behavior: imposta integrityStatus a UNKNOWN di default
        it("TU-F-browsing-17: imposta() should imposta integrityStatus a UNKNOWN di default", () => {
            const dc = new DocumentClass("dip-uuid", "dc-uuid", "Fatture", "2024-01-01T00:00:00Z");
            expect(dc.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
        });

        // identifier: TU-F-browsing-18
        // method_name: id()
        // description: should id è null finché non viene persistito
        // expected_value: matches asserted behavior: id è null finché non viene persistito
        it("TU-F-browsing-18: id() should id è null finché non viene persistito", () => {
            const dc = new DocumentClass("dip-uuid", "dc-uuid", "Fatture", "2024-01-01T00:00:00Z");
            expect(dc.getId()).toBeNull();
        });
    });

    describe("setIntegrityStatus", () => {
        // identifier: TU-F-browsing-21
        // method_name: aggiorna()
        // description: should aggiorna lo stato di integrità
        // expected_value: matches asserted behavior: aggiorna lo stato di integrità
        it("TU-F-browsing-21: aggiorna() should aggiorna lo stato di integrità", () => {
            const dc = new DocumentClass("dip-uuid", "uuid", "Nome", "2024-01-01T00:00:00Z");
            dc.setIntegrityStatus(IntegrityStatusEnum.INVALID);
            expect(dc.getIntegrityStatus()).toBe(IntegrityStatusEnum.INVALID);
        });
    });
});
