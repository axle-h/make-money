import {toPageArgs} from "@/app/api/paginated";


it('sets skip and take', () => {
    const observed = toPageArgs({ page: 3, limit: 5 })
    expect(observed).toEqual({ skip: 10, take: 5 })
})