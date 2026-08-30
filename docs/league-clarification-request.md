# Clarification request for the National Mah Jongg League

Two narrow points reached the end of our rules research without a published League ruling
either way. Find My Mahj publishes both as unsettled rather than guessing. This letter is
ready for the owner to send over her own signature.

Draft:

> I teach American mahjong and run a directory and rules service for players. Two situations
> come up at tables regularly, and I have not found a published ruling on either one. I would
> be grateful for the League's guidance so that I can pass the correct rule along.
>
> 1. The wall is exhausted. A player discards the final tile of the deal. Another player wants
> that discard, not for mahjong, but only to complete an exposure. May that player call it? If
> the call is allowed, what happens next, given that no tiles remain to draw?
>
> 2. A player draws out of turn and then discards that tile. May another player claim that
> discard for an exposure? We have seen the League's answer reported both ways, one indicating
> that such a call is honored and play continues, another indicating that the tile is not
> available for an exposure. The mahjong claim and the payment that follows are clear to us;
> the exposure claim is not.
>
> Thank you for your time. I will make sure players hear the answer accurately.

When the League replies, update `last-tile-of-wall` and `picking-ahead` in
`lib/rules/knowledge.ts`, set the provenance source type to the League reply, add benchmark
cases, and re-run the rules specs and the reviewer gate.
